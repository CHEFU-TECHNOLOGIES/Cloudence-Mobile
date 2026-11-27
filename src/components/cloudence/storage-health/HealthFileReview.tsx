import { useState } from 'react';
import { X } from 'lucide-react-native';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import type { HealthItem } from '../../../lib/api/storageHealth';
import type { CloudFile } from '../../../types/file';
import { convertFileSize } from '../../../utils/fileUtils';
import { theme } from '../../../constants/theme';
import DeleteConfirmationPanel from '../DeleteConfirmationPanel';
import { healthStyles as styles } from './storageHealth.styles';

type Props = {
  item: HealthItem; offline: boolean; onClose: () => void;
  onDelete: (item: HealthItem) => Promise<void>;
  onOpen: (file: CloudFile) => Promise<void>;
};

export default function HealthFileReview({ item, offline, onClose, onDelete, onOpen }: Props) {
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (action: () => Promise<void>, close = false) => {
    setBusy(true);
    setError(null);
    try { await action(); if (close) onClose(); }
    catch (error) { setError(error instanceof Error ? error.message : 'The action could not complete.'); }
    finally { setBusy(false); }
  };
  return (
    <Modal transparent animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <View style={styles.sheet} accessibilityViewIsModal>
            <View style={styles.sheetHeader}>
              <Text style={[styles.heading, styles.grow]}>Review file</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Close file review" disabled={busy} onPress={onClose} style={styles.back}>
                <X size={20} color={theme.colors.text} />
              </Pressable>
            </View>
            <Text style={styles.fileName}>{item.file.name}</Text>
            <Text style={styles.muted}>{convertFileSize(item.file.size)} · {item.reason}</Text>
            {item.keepName && <Text style={styles.muted}>Keep: {item.keepName}</Text>}
            {item.keepFile && !confirm && <Pressable accessibilityRole="button" disabled={busy || offline} style={[styles.button, (busy || offline) && styles.disabled]} onPress={() => void run(() => onOpen(item.keepFile!))}><Text style={styles.buttonText}>Open kept copy to compare</Text></Pressable>}
            {item.file.users.length > 0 && <Text style={styles.shared}>Shared with {item.file.users.length} people. Deleting also removes their access.</Text>}
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {busy ? <ActivityIndicator color={theme.colors.brand} accessibilityLabel="Working" /> : confirm ? (
              <DeleteConfirmationPanel fileName={item.file.name} onCancel={() => setConfirm(false)} onConfirm={() => { if (!offline) void run(() => onDelete(item), true); }} />
            ) : (
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" disabled={offline} style={[styles.button, styles.grow, offline && styles.disabled]} onPress={() => void run(() => onOpen(item.file))}>
                  <Text style={styles.buttonText}>Open file</Text>
                </Pressable>
                <Pressable accessibilityRole="button" disabled={offline} style={[styles.button, styles.destructive, styles.grow, offline && styles.disabled]} onPress={() => setConfirm(true)}>
                  <Text style={[styles.buttonText, styles.destructiveText]}>Delete…</Text>
                </Pressable>
              </View>
            )}
            {offline && <Text style={styles.muted}>Connect to review or delete files.</Text>}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
