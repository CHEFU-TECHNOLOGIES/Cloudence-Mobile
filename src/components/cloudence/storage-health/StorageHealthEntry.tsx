import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { theme } from '../../../constants/theme';
import { healthStyles as styles } from './storageHealth.styles';

export default function StorageHealthEntry() {
  return <Pressable accessibilityRole="button" style={styles.entry} onPress={() => router.push('/storage-health')}>
    <View style={styles.grow}>
      <Text style={styles.entryTitle}>Storage Health Center</Text>
      <Text style={styles.muted}>Review files and reclaim space</Text>
    </View>
    <ChevronRight size={18} color={theme.colors.brand} />
  </Pressable>;
}
