import React, { useState, useEffect } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList, StyleSheet, View, Alert } from "react-native";
import {
  Appbar,
  Button,
  List,
  PaperProvider,
  Switch,
  Text,
  MD3LightTheme as DefaultTheme,
} from "react-native-paper";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';
import myColors from "./assets/colors.json";
import myColorsDark from "./assets/colorsDark.json";

const db = SQLite.openDatabase('locations.db');

export default function App() {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locations, setLocations] = useState([]);git init

  const [theme, setTheme] = useState({
    ...DefaultTheme,
    colors: myColors.colors,
  });

  async function loadDarkMode() {
    try {
      const value = await AsyncStorage.getItem('@dark_mode');
      if (value !== null) {
        setIsSwitchOn(value === 'true');
      }
    } catch (error) {
      console.error(error);
    }
  }

  async function onToggleSwitch() {
    const newValue = !isSwitchOn;
    setIsSwitchOn(newValue);
    await AsyncStorage.setItem('@dark_mode', newValue.toString());
  }

  async function getLocation() {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão para acessar a localização foi negada!');
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      await saveLocation(location.coords);
      loadLocations();
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  }

  const initDb = () => {
    db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS locations (id INTEGER PRIMARY KEY AUTOINCREMENT, latitude REAL, longitude REAL);'
      );
    });
  };

  async function saveLocation(coords) {
    db.transaction(
      tx => {
        tx.executeSql('INSERT INTO locations (latitude, longitude) values (?, ?)', [coords.latitude, coords.longitude]);
      },
      null,
      loadLocations
    );
  }

  async function loadLocations() {
    db.transaction(
      tx => {
        tx.executeSql(
          'SELECT * FROM locations',
          [],
          (_, { rows }) => setLocations(rows._array),
          (t, error) => console.error(error)
        );
      }
    );
  }

  useEffect(() => {
    loadDarkMode();
    initDb();
    loadLocations();
  }, []);

  useEffect(() => {
    if (isSwitchOn) {
      setTheme({ ...theme, colors: myColorsDark.colors });
    } else {
      setTheme({ ...theme, colors: myColors.colors });
    }
  }, [isSwitchOn]);

  return (
    <PaperProvider theme={theme}>
      <Appbar.Header>
        <Appbar.Content title="My Location BASE" />
      </Appbar.Header>
      <View style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.containerDarkMode}>
          <Text>Dark Mode</Text>
          <Switch value={isSwitchOn} onValueChange={onToggleSwitch} />
        </View>
        <Button
          style={styles.containerButton}
          icon="map"
          mode="contained"
          loading={isLoading}
          onPress={getLocation}
        >
          Capturar localização
        </Button>

        <FlatList
          style={styles.containerList}
          data={locations}
          renderItem={({ item }) => (
            <List.Item
              title={`Localização ${item.id}`}
              description={`Latitude: ${item.latitude} | Longitude: ${item.longitude}`}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  containerDarkMode: {
    margin: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  containerButton: {
    margin: 10,
  },
  containerList: {
    margin: 10,
    height: "100%",
  },
});
