import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Linking } from 'react-native';
import { kenyanFoods, diabetesNews } from '../constants/mockData';
import { Colors } from '../constants/colors';

const FoodNewsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'food' | 'news'>('food');

  const renderFoodItem = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardDesc}>{item.description}</Text>
    </View>
  );

  const renderNewsItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(item.url)}>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc}>{item.source}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'food' && styles.activeTab]}
          onPress={() => setActiveTab('food')}
        >
          <Text style={[styles.tabText, activeTab === 'food' && styles.activeTabText]}>Food</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'news' && styles.activeTab]}
          onPress={() => setActiveTab('news')}
        >
          <Text style={[styles.tabText, activeTab === 'news' && styles.activeTabText]}>News</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'food' ? (
        <FlatList
          data={kenyanFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          data={diabetesNews}
          renderItem={renderNewsItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.lightGray,
    borderRadius: 25,
    margin: 16,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: Colors.primaryOrange,
  },
  tabText: {
    color: Colors.darkGray,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryGreen,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.darkGray,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 14,
    color: Colors.darkGray,
  },
});

export default FoodNewsTabs;