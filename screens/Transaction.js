import { Component } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Permissions from "expo-permissions";
import { BarCodeScanner } from "expo-barcode-scanner";

export default class TransactionScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      domState: "normal",
      hasCameraPermissions: null,
      scaned: false,
      scanedData: "",
    };
  }
  getCameraPermissions = async (domState) => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      hasCameraPermissions: status === "granted",
      domState: domState,
      scaned: false,
    });
  };
  handleBarCodeScaned = async ({ type, data }) => {
    this.setState({
      scanedData: data,
      scaned: true,
      domState: "normal",
    });
  };
  render() {
    const { domState, hasCameraPermissions, scaned, scanedData } = this.state;
    if (domState === "scaner") {
      return (
        <BarCodeScanner
          onBarCodeScanned={scaned ? undefined : this.handleBarCodeScaned}
          style={StyleSheet.absoluteFillObject}
        ></BarCodeScanner>
      );
    }
    return (
      <View>
        <Text>
          {hasCameraPermissions ? scanedData : "Solicitar permissao da camera."}
        </Text>
        <TouchableOpacity
          onPress={() => {
            this.getCameraPermissions("scaner");
          }}
        >
          <Text>Escanear QR code</Text>
        </TouchableOpacity>
      </View>
    );
  }
}
