import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Button, ScrollView, Alert,
  StyleSheet, PanResponder, Image
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';

export default function App() {
  const [ip, setIp] = useState("your-ngrok-url.ngrok-free.app");
  const [token, setToken] = useState("secret123");
  const [text, setText] = useState("");
  const [key, setKey] = useState("");
  const [files, setFiles] = useState([]);
  const [imageBase64, setImageBase64] = useState("");
  const [page, setPage] = useState(1);
  const [isTouchingTouchpad, setIsTouchingTouchpad] = useState(false);
  const [currentPath, setCurrentPath] = useState('');
  const [folderItems, setFolderItems] = useState([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`https://${ip}/screenshot?ts=${Date.now()}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const json = await res.json();
        setImageBase64(json.image);
      } catch (err) {
        console.error("Screenshot fetch failed:", err.message);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [ip, token]);

  const sendPost = async (endpoint, data) => {
    try {
      const res = await fetch(`https://${ip}/${endpoint}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      console.log(result);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch(`https://${ip}/files`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const result = await res.json();
      setFiles(result);
    } catch {
      Alert.alert("Error", "Failed to fetch file list");
    }
  };

  const uploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (result.assets?.length > 0) {
      const file = result.assets[0];
      const form = new FormData();
      form.append("file", {
        uri: file.uri,
        name: file.name,
        type: "application/octet-stream"
      });

      try {
        await fetch(`https://${ip}/upload`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: form
        });
        Alert.alert("Upload complete", file.name);
      } catch (err) {
        Alert.alert("Upload failed", err.message);
      }
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => {
      setIsTouchingTouchpad(true);
      return true;
    },
    onPanResponderMove: (_, gestureState) => {
      const dx = Math.round(gestureState.dx);
      const dy = Math.round(gestureState.dy);
      sendPost("move_mouse_relative", { dx, dy });
    },
    onPanResponderRelease: () => setIsTouchingTouchpad(false),
    onPanResponderTerminate: () => setIsTouchingTouchpad(false)
  });

  const browseFolder = async (subPath = '') => {
    try {
      const res = await fetch(`https://${ip}/browse?path=${encodeURIComponent(subPath)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const json = await res.json();
      setCurrentPath(json.current_path || '');
      setFolderItems(Array.isArray(json.items) ? json.items : []);

    } catch (err) {
      Alert.alert("Browse Error", err.message);
    }
  };

  const downloadFile = async (relPath) => {
    try {
      await WebBrowser.openBrowserAsync(`https://${ip}/download_any?path=${encodeURIComponent(relPath)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
    } catch (err) {
      Alert.alert("Download Error", err.message);
    }
  };

  const renderPage = () => {
    switch (page) {
      case 1:
        return (
          <>
            <Text style={styles.section}>🔌 Connect</Text>
            <TextInput placeholder="Ngrok domain" value={ip} onChangeText={setIp} style={styles.input} />
            <TextInput placeholder="Auth token" value={token} onChangeText={setToken} style={styles.input} />
            <Text style={styles.section}>🖥️ Live Screen</Text>
            <Image source={{ uri: `data:image/jpeg;base64,${imageBase64}` }} style={styles.screen} resizeMode="contain" />
            <Text style={styles.section}>🖱️ Touchpad</Text>
            <View {...panResponder.panHandlers}>
              <View style={styles.touchpad}>
                <Text style={{ color: '#999' }}>Drag to move mouse</Text>
              </View>
            </View>
            <Button title="Click" onPress={() => sendPost("click", {})} />
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.section}>⌨️ Keyboard</Text>
            <TextInput placeholder="Text" value={text} onChangeText={setText} style={styles.input} />
            <Button title="Type" onPress={() => sendPost("type", { text })} />
            <TextInput placeholder="Key (e.g. enter)" value={key} onChangeText={setKey} style={styles.input} />
            <Button title="Press" onPress={() => sendPost("press", { key })} />
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.section}>🔊 Volume</Text>
            <View style={styles.row}>
              <Button title="Up" onPress={() => sendPost("volume", { direction: "up" })} />
              <Button title="Down" onPress={() => sendPost("volume", { direction: "down" })} />
              <Button title="Mute" onPress={() => sendPost("volume", { direction: "mute" })} />
            </View>
          </>
        );
      case 4:
        return (
          <>
            <Text style={styles.section}>📂 File Explorer</Text>
            <Button title="Browse PC" onPress={() => browseFolder()} />
            <Text style={styles.section}>📁 Path: {currentPath || "/"}</Text>
            {folderItems.map((item, i) => (
              <Text
                key={i}
                style={styles.file}
                onPress={() => item.is_dir
                  ? browseFolder(`${currentPath}/${item.name}`)
                  : downloadFile(`${currentPath}/${item.name}`)}
              >
                {item.is_dir ? "📁 " : "📄 "}{item.name}
              </Text>
            ))}
            <Button title="Upload File" onPress={uploadFile} />
          </>
        );
      default:
        return <Text>Page not found</Text>;
    }
  };

  return (
    <ScrollView style={styles.container} scrollEnabled={!isTouchingTouchpad}>
      <Text style={styles.header}>RemoteBuddy</Text>
      {renderPage()}
      <View style={styles.row}>
        {[1, 2, 3, 4].map(p => (
          <Button key={p} title={`Page ${p}`} onPress={() => setPage(p)} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: "#ccc",
    padding: 10, marginVertical: 5, borderRadius: 8
  },
  section: {
    marginTop: 20, marginBottom: 10,
    fontSize: 18, fontWeight: '600'
  },
  touchpad: {
    height: 150, backgroundColor: "#eee",
    borderRadius: 10, marginBottom: 10,
    justifyContent: 'center', alignItems: 'center'
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20
  },
  file: {
    marginVertical: 3,
    color: "#007aff"
  },
  screen: {
    width: '100%',
    height: 200,
    backgroundColor: '#ddd',
    borderRadius: 10,
    marginBottom: 10
  }
});
