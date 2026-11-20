import { Trash } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CloudFile } from "../../types/file";
import { theme } from "../../constants/theme";
import ConfirmDialog from "./ConfirmDialog";
import { styles } from "./FileActionModal.styles";
import { useToast } from "./ToastProvider";

type Props = {
  file: CloudFile;
  onClose: () => void;
  onShare?: (fileId: string, emails: string[]) => void | Promise<void>;
};

export default function FileSharePanel({ file, onClose, onShare }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
  const { showToast } = useToast();

  const submitAccessUpdate = (emails: string[]) => {
    onClose();
    void Promise.resolve()
      .then(() => onShare?.(file.id, emails))
      .catch((error: unknown) => {
        showToast({
          title: "Access update failed",
          message:
            error instanceof Error
              ? error.message
              : "File access could not be updated.",
          variant: "error",
        });
      });
  };

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email || !email.includes("@")) {
      showToast({
        title: "Invalid email",
        message: "Please enter a valid email address.",
        variant: "error",
      });
      return;
    }
    if (file.users.includes(email)) {
      showToast({
        title: "Already shared",
        message: "This user already has access.",
        variant: "info",
      });
      return;
    }
    submitAccessUpdate([...file.users, email]);
  };

  const confirmRemoveAccess = () => {
    if (!emailToRemove) return;
    submitAccessUpdate(file.users.filter((email) => email !== emailToRemove));
    setEmailToRemove(null);
  };

  return (
    <>
      <View style={styles.subModalContent}>
        <Text style={styles.subModalTitle}>Share File</Text>
        <Text style={styles.subModalDesc}>
          Grant access by email to collaborate on this file.
        </Text>

        <View style={styles.addEmailRow}>
          <TextInput
            value={emailInput}
            onChangeText={setEmailInput}
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="user@example.com"
            placeholderTextColor={theme.colors.mutedText}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Pressable style={styles.addEmailBtn} onPress={handleAddEmail}>
            <Text style={styles.addEmailBtnText}>Share</Text>
          </Pressable>
        </View>

        <Text style={styles.sharedSectionTitle}>
          Users with access ({file.users.length})
        </Text>
        <ScrollView
          style={styles.emailList}
          showsVerticalScrollIndicator={false}
        >
          {file.users.map((email) => (
            <View key={email} style={styles.emailItem}>
              <Text numberOfLines={1} style={styles.emailText}>
                {email}
              </Text>
              <Pressable
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Remove access for ${email}`}
                onPress={() => setEmailToRemove(email)}
                style={styles.removeEmailBtn}
              >
                <Trash size={15} color={theme.colors.error} />
              </Pressable>
            </View>
          ))}
          {file.users.length === 0 && (
            <Text style={styles.noEmailsText}>No one has access yet.</Text>
          )}
        </ScrollView>

        <Pressable style={styles.backBtnFull} onPress={onClose}>
          <Text style={styles.backBtnText}>Done</Text>
        </Pressable>
      </View>

      <ConfirmDialog
        embedded
        visible={emailToRemove !== null}
        title="Remove collaborator access?"
        message={`${emailToRemove ?? "This person"} will no longer be able to access this file.`}
        confirmLabel="Remove access"
        destructive
        onCancel={() => setEmailToRemove(null)}
        onConfirm={confirmRemoveAccess}
      />
    </>
  );
}
