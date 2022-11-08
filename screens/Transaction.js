import React, { Component } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ImageBackground,
  Image,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";
import db from "../config";

const bgImage = require("../assets/background2.png");
const appIcon = require("../assets/appIcon.png");
const appName = require("../assets/appName.png");

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      bookId: "",
      studentId: "",
      domState: "normal",
      hasCameraPermissions: null,
      scanned: false,
      bookName: "",
      studentName: "",
    };
  }
  handleTransaction = async () => {
    var { bookId, studentId } = this.state;
    await this.getBookDetails(bookId);
    await this.getStudentDetails(studentId);
    var transactionType = await this.checkBookAvailability(bookId);
    if (!transactionType) {
      this.setState({ bookId: "", studentId: "" });
      Alert.alert("O livro nao foi encontrado");
    } else if (transactionType === "issue") {
      var isAvailable = await this.checkStudent(studentId);
      if (isAvailable) {
        var { bookName, studentName } = this.state;
        this.initiateBookIssue(bookId, studentId, bookName, studentName);
        Alert.alert("Livro retirado");
      } else {
        var isAvailable = await this.checkStudentEligibilityForBookReturn(
          bookId,
          studentId
        );
        if (isAvailable) {
          Alert.alert("Livro devolvido");
          var { bookName, studentName } = this.state;
          this.initiateBookReturn(bookId, studentId, bookName, studentName);
        }
      }
    }
  };

  checkBookAvailability = async (bookId) => {
    const bookRef = await db
      .collection("BSC001")
      .where("book_id", "==", bookId)
      .get();

    var transactionType = "";
    if (bookRef.docs.length == 0) {
      transactionType = false;
    } else {
      bookRef.docs.map((doc) => {
        //se o livro estiver disponível, o tipo de transação será issue (entregar)
        // caso contrário, será return (devolver)
        transactionType = doc.data().is_book_available ? "issue" : "return";
      });
    }

    return transactionType;
  };

  //Bp
  checkStudentEligibilityForBookReturn = async (bookId, studentId) => {
    const transactionRef = await db
      .collection("Transactions")
      .where("book_id", "==", bookId)
      .limit(1)
      .get();
    var isStudentEligible = "";
    transactionRef.docs.map((doc) => {
      var lastBookTransaction = doc.data();
      if (lastBookTransaction.student_id === studentId) {
        isStudentEligible = true;
      } else {
        isStudentEligible = false;
        Alert.alert("O livro não foi retirado por este aluno!");
        this.setState({
          bookId: "",
          studentId: "",
        });
      }
    });
    return isStudentEligible;
  };

  checkStudent = async (studentId) => {
    const STDRef = await db
      .collection("STD")
      .where("student_id", "==", studentId)
      .get();
    var isStudentEligible = "";

    if (STDRef.docs.length == 0) {
      isStudentEligible = false;
      this.setState({
        bookId: "",
        studentId: "",
      });
      Alert.alert("Esse aluno nao existe");
    } else {
      STDRef.docs.map((doc) => {
        if (doc.data().number_of_books_issued < 2) {
          isStudentEligible = true;
        } else {
          isStudentEligible = false;
          this.setState({
            bookId: "",
            studentId: "",
          });
          Alert.alert("o aluno nao pode pegar mais livros");
        }
      });
    }

    return isStudentEligible;
  };

  getBookDetails = (bookId) => {
    bookId = bookId.trim();
    db.collection("BSC001")
      .where("book_id", "==", bookId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            bookName: doc.data().book_details.book_name,
          });
        });
      });
  };

  getStudentDetails = (studentId) => {
    studentId = studentId.trim();
    db.collection("STD")
      .where("student_id", "==", studentId)
      .get()
      .then((snapshot) => {
        snapshot.docs.map((doc) => {
          this.setState({
            studentName: doc.data().student_details.student_name,
          });
        });
      });
  };

  initiateBookIssue = async (bookId, studentId, bookName, studentName) => {
    db.collection("Transactions").add({
      book_id: bookId,
      student_id: studentId,
      book_name: bookName,
      student_name: studentName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "issue",
    });
    db.collection("BSC001").doc(bookId).update({
      is_book_available: false,
    });
    db.collection("STD")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(1),
      });
    this.setState({
      bookId: "",
      studentId: "",
    });
  };
  initiateBookReturn = async (bookId, studentId, bookName, studentName) => {
    db.collection("Transactions").add({
      book_id: bookId,
      student_id: studentId,
      book_name: bookName,
      student_name: studentName,
      date: firebase.firestore.Timestamp.now().toDate(),
      transaction_type: "return",
    });
    db.collection("BSC001").doc(bookId).update({
      is_book_available: true,
    });
    db.collection("STD")
      .doc(studentId)
      .update({
        number_of_books_issued: firebase.firestore.FieldValue.increment(-1),
      });
    this.setState({
      bookId: "",
      studentId: "",
    });
  };

  getCameraPermissions = async (domState) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);

    this.setState({
      /*status === "granted" é verdadeiro se o usuário concedeu permissão
          status === "granted" é falso se o usuário não concedeu permissão
        */
      hasCameraPermissions: status === "granted",
      domState: domState,
      scanned: false,
    });
  };

  handleBarCodeScanned = async ({ type, data }) => {
    const { domState } = this.state;

    if (domState === "bookId") {
      this.setState({
        bookId: data,
        domState: "normal",
        scanned: true,
      });
    } else if (domState === "studentId") {
      this.setState({
        studentId: data,
        domState: "normal",
        scanned: true,
      });
    }
  };

  render() {
    const { bookId, studentId, domState, scanned } = this.state;
    if (domState !== "normal") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scanned ? undefined : this.handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
      );
    }
    return (
      <KeyboardAvoidingView behavior="padding" style={styles.container}>
        <ImageBackground source={bgImage} style={styles.bgImage}>
          <View style={styles.upperContainer}>
            <Image source={appIcon} style={styles.appIcon} />
            <Image source={appName} style={styles.appName} />
          </View>
          <View style={styles.lowerContainer}>
            <View style={styles.textinputContainer}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Livro"}
                placeholderTextColor={"#FFFFFF"}
                value={bookId}
                onChangeText={(text) => this.setState({ bookId: text })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("bookId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.textinputContainer, { marginTop: 25 }]}>
              <TextInput
                style={styles.textinput}
                placeholder={"ID do Estudante"}
                placeholderTextColor={"#FFFFFF"}
                value={studentId}
                onChangeText={(text) => this.setState({ studentId: text })}
              />
              <TouchableOpacity
                style={styles.scanbutton}
                onPress={() => this.getCameraPermissions("studentId")}
              >
                <Text style={styles.scanbuttonText}>Digitalizar</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.button, { marginTop: 25 }]}
              onPress={this.handleTransaction}
            >
              <Text style={styles.buttonText}>Enviar</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </KeyboardAvoidingView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bgImage: {
    flex: 1,
    resizeMode: "cover",
    justifyContent: "center",
  },
  upperContainer: {
    flex: 0.5,
    justifyContent: "center",
    alignItems: "center",
  },
  appIcon: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginTop: 80,
  },
  appName: {
    width: 180,
    resizeMode: "contain",
  },
  lowerContainer: {
    flex: 0.5,
    alignItems: "center",
  },
  textinputContainer: {
    borderWidth: 2,
    borderRadius: 10,
    flexDirection: "row",
    backgroundColor: "#9DFD24",
    borderColor: "#FFFFFF",
  },
  textinput: {
    width: "57%",
    height: 50,
    padding: 10,
    borderColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 3,
    fontSize: 18,
    backgroundColor: "#5653D4",
    fontFamily: "Rajdhani_600SemiBold",
    color: "#FFFFFF",
  },
  scanbutton: {
    width: 100,
    height: 50,
    backgroundColor: "#9DFD24",
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  scanbuttonText: {
    fontSize: 20,
    color: "#0A0101",
    fontFamily: "Rajdhani_600SemiBold",
  },
  button: {
    width: "43%",
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F48D20",
    borderRadius: 15,
  },
  buttonText: {
    fontSize: 25,
    color: "#FFFFFF",
    fontFamily: "Rajdhani_600SemiBold",
  },
});
