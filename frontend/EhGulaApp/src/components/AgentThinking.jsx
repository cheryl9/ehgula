import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function AgentThinking({ steps, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    if (currentStep >= steps.length) {
      const timer = setTimeout(() => onComplete && onComplete(), 500)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      setCurrentStep(prev => prev + 1)
    }, 900)
    return () => clearTimeout(timer)
  }, [currentStep, steps.length])

  const getStatus = (index) => {
    if (index < currentStep) return 'done'
    if (index === currentStep) return 'active'
    return 'pending'
  }

  return (
    <View style={styles.container}>
      {steps.map((step, i) => {
        const status = getStatus(i)
        return (
          <View key={i} style={styles.row}>
            <View style={styles.iconWrap}>
              {status === 'done' && (
                <Text style={styles.iconDone}>✓</Text>
              )}
              {status === 'active' && (
                <Text style={styles.iconActive}>↻</Text>
              )}
              {status === 'pending' && (
                <View style={styles.iconPending} />
              )}
            </View>
            <Text style={[
              styles.stepText,
              status === 'done' && styles.stepDone,
              status === 'active' && styles.stepActive,
              status === 'pending' && styles.stepPending,
            ]}>
              {step}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
    marginRight: 10,
  },
  iconDone: {
    fontSize: 14,
    color: '#5B9E8F',
    fontWeight: '600',
  },
  iconActive: {
    fontSize: 14,
    color: '#5B9E8F',
    fontWeight: '600',
  },
  iconPending: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CCCCCC',
  },
  stepText: {
    fontSize: 13,
    flex: 1,
  },
  stepDone: {
    color: '#1A1A1A',
    fontWeight: '500',
  },
  stepActive: {
    color: '#5B9E8F',
    fontWeight: '500',
  },
  stepPending: {
    color: '#AAAAAA',
  },
})