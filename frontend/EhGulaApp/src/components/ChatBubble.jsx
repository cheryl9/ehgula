import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ChatBubble({ message, sender, time }) {
  const isAgent = sender === 'agent'

  return (
    <View style={[styles.row, isAgent ? styles.rowAgent : styles.rowPatient]}>
      <View style={[styles.bubble, isAgent ? styles.bubbleAgent : styles.bubblePatient]}>
        <Text style={[styles.text, isAgent ? styles.textAgent : styles.textPatient]}>
          {message}
        </Text>
      </View>
      {time ? (
        <Text style={[styles.time, isAgent ? styles.timeLeft : styles.timeRight]}>
          {time}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    marginBottom: 10,
    maxWidth: '80%',
  },
  rowAgent: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  rowPatient: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleAgent: {
    backgroundColor: '#5B9E8F',
    borderBottomLeftRadius: 4,
  },
  bubblePatient: {
    backgroundColor: '#EEEEEE',
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textAgent: {
    color: '#FFFFFF',
  },
  textPatient: {
    color: '#1A1A1A',
  },
  time: {
    fontSize: 10,
    color: '#AAAAAA',
    marginTop: 3,
    marginHorizontal: 4,
  },
  timeLeft: {
    alignSelf: 'flex-start',
  },
  timeRight: {
    alignSelf: 'flex-end',
  },
})