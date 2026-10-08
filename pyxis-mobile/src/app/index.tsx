import React from 'react';
import { SafeAreaView, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // Εδώ βάζουμε το URL της εφαρμογής σου. 
  // Έχω βάλει το live URL από το Render, αλλά αν θες να κάνεις δοκιμές τοπικά, 
  // μπορείς να βάλεις την IP του υπολογιστή σου (π.χ. 'http://192.168.1.12:3000')
  const PYXIS_URL = 'https://pyxis-u0m9.onrender.com/';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <WebView 
        source={{ uri: PYXIS_URL }} 
        style={styles.webview}
        // Επιτρέπει το JavaScript και τα animations του React.js να τρέχουν κανονικά
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa', // Το χρώμα φόντου της εφαρμογής σου
  },
  webview: {
    flex: 1,
  },
});