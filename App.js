import { Component } from "react";
import BottomTabNavigator from "./components/bottonTabNavigator";
import * as Font from "expo-font";
import { Rajdhani_600SemiBold } from "@expo-google-fonts/rajdhani";

export default class App extends Component {
  constructor() {
    super();
    this.state = {
      isLoaded: false,
    };
  }
  async loadFont() {
    await Font.loadAsync({
      Rajdhani_600SemiBold: Rajdhani_600SemiBold,
    });
    this.setState({
      isLoaded: true,
    });
  }
  componentDidMount() {
    this.loadFont();
  }
  render() {
    const { isLoaded } = this.state;
    if (isLoaded) {
      return <BottomTabNavigator></BottomTabNavigator>;
    }
    return null;
  }
}
