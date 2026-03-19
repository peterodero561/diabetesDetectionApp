import React from 'react';
import { FlatList, View, Dimensions, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { HealthData } from '../types';
import { Colors } from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

interface Props {
  data: HealthData[];
}

const ChartCarousel: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.date.slice(5)), // MM-DD
    datasets: [
      {
        data: data.map(d => d.glucose),
        color: (opacity = 1) => Colors.primaryRed,
        strokeWidth: 2,
      },
      {
        data: data.map(d => d.bmi),
        color: (opacity = 1) => Colors.primaryGreen,
        strokeWidth: 2,
      },
    ],
    legend: ['Glucose (mg/dL)', 'BMI'],
  };

  return (
    <FlatList
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      data={[{ key: 'glucose' }, { key: 'bmi' }]}
      renderItem={({ item }) => (
        <View style={styles.chartContainer}>
          {item.key === 'glucose' ? (
            <LineChart
              data={{
                labels: data.map(d => d.date.slice(5)),
                datasets: [{ data: data.map(d => d.glucose) }],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: Colors.white,
                backgroundGradientFrom: Colors.white,
                backgroundGradientTo: Colors.lightGray,
                decimalPlaces: 0,
                color: (opacity = 1) => Colors.primaryRed,
                labelColor: (opacity = 1) => Colors.darkGray,
              }}
              bezier
              style={styles.chart}
            />
          ) : (
            <LineChart
              data={{
                labels: data.map(d => d.date.slice(5)),
                datasets: [{ data: data.map(d => d.bmi) }],
              }}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: Colors.white,
                backgroundGradientFrom: Colors.white,
                backgroundGradientTo: Colors.lightGray,
                decimalPlaces: 1,
                color: (opacity = 1) => Colors.primaryGreen,
                labelColor: (opacity = 1) => Colors.darkGray,
              }}
              bezier
              style={styles.chart}
            />
          )}
        </View>
      )}
      keyExtractor={item => item.key}
    />
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default ChartCarousel;