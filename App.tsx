/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import { useRef, useState, useMemo, useCallback } from 'react';
import {
  NativeModules, Button, View, Text,
  StyleSheet, TouchableOpacity, SafeAreaView,
  useColorScheme, ScrollView, Image, Alert, TextInput
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { AppConfig } from './AppConfig';
// import { CameraViewScreen } from './app/screens/camera-view-screen';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';
import {
  CameraDeviceFormat,
  CameraRuntimeError,
  FrameProcessorPerformanceSuggestion,
  PhotoFile,
  sortFormats,
  useCameraDevices,
  useFrameProcessor,
  VideoFile,
} from 'react-native-vision-camera';
import { CONTENT_SPACING, MAX_ZOOM_FACTOR, SAFE_AREA_PADDING, BUTTON_SIZE } from './app/utils/Constants';
import RNFS from 'react-native-fs';

const App = () => {
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [showCameraScreen, setShowCameraScreen] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [flow, setFlow] = useState(null);

  const [result, setResult] = useState(null);
  const [base64Img, setB64Image] = useState('');
  const [user, setUser] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const fields = ["names"];
  const [isLoading, setLoading] = useState(false);
  const [nameInput, setNameInput] = React.useState("Insert Your Name");

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  const devices = useCameraDevices();
  // const device = devices[cameraPosition];
  const device = devices.front;
  // const isFocused = useIsFocused()
  const camera = useRef(null);

  if (device == null) {
    return (
      <View>
        <Text>Loading</Text>
      </View>
    );
  }

  // const [cameraPermission, setCameraPermission] = React.useState<CameraPermissionStatus>();
  // const [microphonePermission, setMicrophonePermission] = React.useState<CameraPermissionStatus>();

  // React.useEffect(() => {
  //   Camera.getCameraPermissionStatus().then(setCameraPermission);
  // }, []);

  // const requestCameraPermission = React.useCallback(async () => {
  //   await Camera.requestCameraPermission();
  // }, []);


  // React.useEffect(()=> {
  //   if(cameraPermission !== 'authorized'){
  //     requestCameraPermission();
  //   }
  // }, [cameraPermission]);

  const onStartGetListFlow = () => {
    // onPressShowCamera();
    setFlow("getList");
    setShowWelcomeScreen(false);
    setShowCameraScreen(false);
    setShowResultScreen(true);
    onCallGetList();
  }

  const onStartEnrollFlow = () => {
    onPressShowCamera();
    setFlow("enroll");
  }

  const onStartRecognizeFlow = () => {
    onPressShowCamera();
    setFlow("recognize")
  }

  const onPressShowCamera = () => {
    console.log("123")
    setShowCameraScreen(true);
    setShowWelcomeScreen(false);
  };

  const onPressShowResultScreen = () => {
    console.log("123")
    setShowResultScreen(true);
    setShowCameraScreen(false);
    setShowWelcomeScreen(false);
  };

  const onPressShowWelcomeScreen = () => {
    setShowWelcomeScreen(true);
    setShowResultScreen(false);
    setShowCameraScreen(false);
  }

  const onPressTakePhoto = async () => {
    // console.log(camera.current)
    // console.log(123)
    const photo = await camera.current.takePhoto({
      flash: 'off',
      qualityPrioritization: "speed"
    })
    console.log(photo);
    // const result = JSON.parse(photo);
    // console.log("Result: ",result);
    console.log("Photo: ", photo.path)
    
    RNFS.readFile(photo?.path, 'base64')
    .then(res =>{
      console.log(res);
      if (flow === 'enroll') {
        onCallEnroll(res);
        onPressShowResultScreen();
      }
      if (flow === 'recognize') {
        onCallRecognize(res);
        onPressShowResultScreen();
      }
    });
    // const reader = new FileReader();
    // reader.onloadend = () => {
    //   console.log(reader.result);
    //   // Logs data:image/jpeg;base64,wL2dvYWwgbW9yZ...

    //   // Convert to Base64 string
    //   const base64 = getBase64StringFromDataURL(reader.result);
    //   console.log(base64);
      
    // };
  }

  const onCallGetList = async () => {
    try {
      setLoading(true);
      const response = await fetch(AppConfig.AI_HOST + AppConfig.GET_LIST_USER, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();
      console.log(JSON.stringify(result));
      setResult(JSON.stringify(result));
    } catch (e) {
      Alert.alert("", "Failed to Get User List");
      setResult("Generic Error");
    }
    setLoading(false);
  };

  const onCallEnroll = async (imageBase64) => {
    setLoading(true);
    const payload = {
      "name": nameInput?.text,
      "image": imageBase64
    };
    try {
      const response = await fetch(AppConfig.AI_HOST + AppConfig.ENROLL_NEW_USER, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      console.log(JSON.stringify(result));
      if (result) {
        if (result["code"] === "0000") {
          setResult("Enroll User Success");
        } else {
          setResult("Failed to Enroll User");
        }
      }
    } catch (e) {
      console.log(e);
      Alert.alert("", "Failed to Enroll User");
      setResult("Generic Error");    
    }
    setLoading(false);
  };

  const onCallRecognize = async (imageBase64: any) => {
    setLoading(true);
    const payload = {
      "image": imageBase64
    };
    try {
      const response = await fetch(AppConfig.AI_HOST + AppConfig.RECOGNIZE_FACE, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result) {
        console.log(JSON.stringify(result));
        setResult(JSON.stringify(result));

        if (result["confidence"] && result["confidence"] != "NONE") {
          Alert.alert("", "Successful!")
          const tmpUser = result["confidence"];
          setResult(JSON.stringify(result["confidence"]))
          const image = 'data:image/png;base64,' + result["raw_image"];
          console.log(image);
          setB64Image(image);
        } else {
          setResult("Failed to Recognize User");
        }
      }
    } catch (e) {
      console.log(e);
      Alert.alert("", "Failed to Recognize User");
      setResult("Generic Error");
    }
    setLoading(false);
  };



  const CameraViewScreen = () => {
    return (
      <View style={styles.container}>
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
        <View style={styles.captureButton}>
          <TouchableOpacity
            style={styles.roundButton1}
            onPress={onPressTakePhoto}
          >
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const WelcomeScreen = () => {
    return (
      <>
        <View style={styles.button}>
          <Button
            title="Start Get List"
            color="#841584"
            onPress={onStartGetListFlow}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Start Enroll"
            color="#841584"
            onPress={onStartEnrollFlow}
          />
        </View>
        <View style={styles.button}>
          <Button
            title="Start Recognize"
            color="#841584"
            onPress={onStartRecognizeFlow}
          />
        </View>
      </>
    )
  }

  const ResultScreen = () => {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <ScrollView>
          {/* <View style={styles.container}>
          <Text>API /get-list</Text>
          <Button
            title="Call API /get-list!"
            color="#841584"
            onPress={onCallGetList}
          />
        </View>

        <View style={styles.container}>
          <Text>API /get-list</Text>
          <Button
            title="Call API /enroll-new-user!"
            color="#800000"
            onPress={onCallEnroll}
          />
        </View>

        <View style={styles.container}>
          <Text>API /get-list</Text>
          <Button
            title="Call API /recognize!"
            color="#100000"
            onPress={onCallRecognize}
          />
        </View> */}
          {isLoading == true ?
            <Text>Loading</Text>
            : null
          }
          {isLoading == false ? <View style={styles.centerFlex}>
            <Text style={styles.textStyle}>{result}</Text>
          </View> : <></>}

          {base64Img && isLoading == false ? <View>
            <View style={styles.centerFlex}>
              <Text style={styles.textStyle}>{user}</Text>
            </View>
            <Image
              style={
                styles.imageSize
              }
              source={{
                uri: base64Img
              }}
            />
          </View> : <></>}
          {isLoading === false ? 
          <Button
            title="Continue"
            color="#841584"
            onPress={onPressShowWelcomeScreen}
          />: null}

        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <View style={styles.container}>




      {showWelcomeScreen ? <>
        <View style={{ padding: 10 }}>
          <TextInput
            style={{ height: 40, backgroundColor: 'azure', fontSize: 20 }}
            placeholder="Type here to translate!"
            onChangeText={(text) => setNameInput({ text })}
          />
        </View>
        <WelcomeScreen />
      </> : null}

      {showCameraScreen ? <CameraViewScreen /> : null}

      {showResultScreen ? <ResultScreen /> : null}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'center',
  },
  welcomeContainer: {
    flex: 1,
    // marginBottom: SAFE_AREA_PADDING.paddingBottom,
  },
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: SAFE_AREA_PADDING.paddingBottom,
  },
  button: {
    margin: CONTENT_SPACING,
  },
  rightButtonRow: {
    position: 'absolute',
    right: SAFE_AREA_PADDING.paddingRight,
    top: SAFE_AREA_PADDING.paddingTop,
  },
  text: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  roundButton1: {
    width: 60,
    height: 60,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    borderRadius: 100,
    borderColor: 'red',
    backgroundColor: 'red',
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
  resultContainer: {
    alignItems: 'center'
  },
  centerFlex: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  textStyle: {
    fontSize: 20,
    fontWeight: "900",
  },
  imageSize: {
    width: 300,
    height: 400,
  }
});
export default App;
