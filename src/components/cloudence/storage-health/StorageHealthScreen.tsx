import { useState } from 'react';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../../auth/SessionContext';
import { useResponsiveLayout } from '../../../hooks/useResponsiveLayout';
import { HEALTH_CATEGORIES, type HealthCategory, type HealthItem } from '../../../lib/api/storageHealth';
import { convertFileSize } from '../../../utils/fileUtils';
import { theme } from '../../../constants/theme';
import { useStorageHealth } from './useStorageHealth';
import { healthStyles as styles } from './storageHealth.styles';
import HealthFileReview from './HealthFileReview';

const copy: Record<HealthCategory, { title: string; tab: string; description: string; empty: string }> = {
  duplicates: { title: 'Duplicate copies', tab: 'Duplicates', description: 'Matching content. Keep the original listed for each copy.', empty: 'No confirmed duplicate copies found.' },
  versions: { title: 'Possible older versions', tab: 'Versions', description: 'Based on v1, v2 and similar filenames. Compare before deleting.', empty: 'No older version names found.' },
  largeMedia: { title: 'Large photos & media', tab: 'Large media', description: 'Photos over 10 MB; video and audio over 25 MB. Compress elsewhere, upload and check the result first.', empty: 'No media above these size thresholds.' },
  olderFiles: { title: 'Older files', tab: 'Older files', description: 'Unshared and unchanged for 90+ days. This does not mean unused.', empty: 'No older unshared files found.' },
};

export default function StorageHealthScreen() {
  const layout = useResponsiveLayout();
  const health = useStorageHealth();
  const { user } = useSession();
  const [category, setCategory] = useState<HealthCategory | null>(null);
  const [selection, setSelection] = useState<{ userId: string; item: HealthItem } | null>(null);
  const report = health.report;
  const selected = selection?.userId === user?.id ? selection?.item : null;
  const bucket = report && category ? report.categories[category] : null;
  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.content, { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', paddingHorizontal: layout.horizontalPadding }]}
        refreshControl={<RefreshControl refreshing={health.loading} onRefresh={() => void health.scan()} tintColor={theme.colors.brand} />}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" style={styles.back} onPress={() => { if (category) setCategory(null); else if (router.canGoBack()) router.back(); else router.replace('/'); }}>
            <ChevronLeft size={23} color={theme.colors.text} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Storage Health Center</Text>
        </View>
        {health.error && <View style={styles.card}><Text accessibilityRole="alert" style={styles.error}>{health.error}</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => void health.scan()}><Text style={styles.buttonText}>Try again</Text></Pressable></View>}
        {health.loading && !report && !health.error && <View style={styles.card}><ActivityIndicator color={theme.colors.brand} /><Text style={styles.muted}>Checking your files…</Text></View>}
        {report && !category && (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Space to review</Text>
              <Text style={styles.heroNumber}>{convertFileSize(report.reviewedBytes)}</Text>
              <Text style={styles.heroDetail}>Suggestions, not all wasted space. You choose what stays.</Text>
              <View style={styles.heroDivider} />
              <Text style={styles.heroDetail}>{convertFileSize(report.duplicateBytes)} in confirmed duplicate copies</Text>
            </View>
            <Text style={styles.muted}>{report.scannedFiles} owned files checked · {new Date(report.scannedAt).toLocaleDateString()}{report.truncated ? '\nPartial scan: first 10,000 records checked.' : ''}</Text>
            {HEALTH_CATEGORIES.map(key => (
              <Pressable key={key} accessibilityRole="button" accessibilityLabel={`Review ${copy[key].title}`} style={styles.card} onPress={() => setCategory(key)}>
                <View style={styles.categoryRow}>
                  <View style={styles.grow}><Text style={styles.heading}>{copy[key].title}</Text><Text style={styles.muted}>{report.categories[key].count} files</Text></View>
                  <Text style={styles.amount}>{convertFileSize(report.categories[key].bytes)}</Text>
                  <ChevronRight size={17} color={theme.colors.secondaryText} />
                </View>
              </Pressable>
            ))}
            {report.unhashedFiles > 0 && <Text style={styles.muted}>{report.unhashedFiles} files have no content checksum and could not be checked for duplicates.</Text>}
            <Text style={styles.muted}>Nothing is deleted automatically. Files appear in one suggestion group only. Keep important originals and shared copies.</Text>
          </>
        )}
        {report && category && bucket && (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
              {HEALTH_CATEGORIES.map(key => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: category === key }} onPress={() => setCategory(key)} style={[styles.tab, category === key && styles.activeTab]}><Text style={styles.tabText}>{copy[key].tab}</Text></Pressable>)}
            </ScrollView>
            <View style={styles.card}>
              <Text style={styles.heading}>{copy[category].title}</Text>
              <Text style={styles.amount}>{convertFileSize(bucket.bytes)} · {bucket.count} files</Text>
              <Text style={styles.muted}>{copy[category].description}</Text>
              {bucket.count > bucket.items.length && <Text style={styles.muted}>Showing the first {bucket.items.length} suggestions. Rescan after cleanup to see more.</Text>}
              {!bucket.count && <Text style={styles.muted}>{copy[category].empty}</Text>}
              {bucket.items.map(item => (
                <Pressable key={item.file.id} accessibilityRole="button" accessibilityLabel={`Review ${item.file.name}`} style={styles.fileRow} onPress={() => { if (user?.id) setSelection({ userId: user.id, item }); }}>
                  <View style={styles.grow}>
                    <Text numberOfLines={2} style={styles.fileName}>{item.file.name}</Text>
                    <Text style={styles.muted}>{convertFileSize(item.file.size)}</Text>
                    {item.keepName && <Text numberOfLines={2} style={styles.muted}>Keep: {item.keepName}</Text>}
                    {!!item.file.users.length && <Text style={styles.shared}>Shared file · review with care</Text>}
                  </View>
                  <ChevronRight size={17} color={theme.colors.secondaryText} />
                </Pressable>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      {selected && <HealthFileReview key={`${user?.id}:${selected.file.id}`} item={selected} offline={health.isOffline} onClose={() => setSelection(null)} onDelete={health.deleteReviewedFile} onOpen={health.download} />}
    </SafeAreaView>
  );
}
