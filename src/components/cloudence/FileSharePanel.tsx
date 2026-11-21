import { ChevronDown, Trash } from "lucide-react-native";
import { useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from "react-native";
import { CloudFile } from "../../types/file";
import { theme } from "../../constants/theme";
import ConfirmDialog from "./ConfirmDialog";
import { styles } from "./FileActionModal.styles";
import { useToast } from "./ToastProvider";

function expirationDate(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

type Props = {
  file: CloudFile;
  onClose: () => void;
  onShare?: (
    fileId: string,
    emails: string[],
    userExpiration?: { email: string; expiresAt: string | null },
  ) => void | Promise<void>;
};

export default function FileSharePanel({ file, onClose, onShare }: Props) {
  const [emailInput, setEmailInput] = useState("");
  const [emailToRemove, setEmailToRemove] = useState<string | null>(null);
  const [expandedExpirationEmail, setExpandedExpirationEmail] =
    useState<string | null>(null);
  const emailListRef = useRef<ScrollViewInstance>(null);
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

  const updateExpiration = (email: string, days: number | null) => {
    if (!onShare) return;
    const expiresAt = days === null ? null : expirationDate(days);
    setExpandedExpirationEmail(null);
    onClose();
    void Promise.resolve()
      .then(() => onShare(file.id, file.users, { email, expiresAt }))
      .then(() => {
        showToast({
          title: "Access updated",
          message:
            days === null
              ? `${email} has no expiration date.`
              : `${email}'s access expires in ${days} days.`,
          variant: "success",
        });
      })
      .catch((error: unknown) => {
        showToast({
          title: "Could not update access",
          message: error instanceof Error ? error.message : "Please try again.",
          variant: "error",
        });
      });
  };

  const expirationLabel = (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const perUser = file.shareExpiresAtByUser ?? {};
    const hasIndividualExpiration = Object.prototype.hasOwnProperty.call(perUser, normalizedEmail);
    const expiresAt = hasIndividualExpiration
      ? perUser[normalizedEmail]
      : file.shareExpiresAt;
    return expiresAt
      ? `Until ${new Date(expiresAt).toLocaleDateString()}`
      : "No expiry";
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
          ref={emailListRef}
          style={styles.emailList}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {file.users.map((email) => (
            <View
              key={email}
              onLayout={(event) => {
                if (expandedExpirationEmail !== email) return;
                const { y, height } = event.nativeEvent.layout;
                emailListRef.current?.scrollTo({
                  y: Math.max(0, y + height - 210),
                  animated: true,
                });
              }}
            >
              <View style={styles.emailItem}>
                <View style={styles.collaboratorInfo}>
                  <Text numberOfLines={1} style={styles.emailText}>
                    {email}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Set expiration for ${email}`}
                    accessibilityState={{
                      expanded: expandedExpirationEmail === email,
                    }}
                    onPress={() =>
                      setExpandedExpirationEmail((current) =>
                        current === email ? null : email,
                      )
                    }
                    style={styles.expirationDropdownTrigger}
                  >
                    <Text style={styles.expirationTriggerText}>
                      {expirationLabel(email)}
                    </Text>
                    <ChevronDown size={14} color={theme.colors.secondaryText} />
                  </Pressable>
                </View>
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
              {expandedExpirationEmail === email && (
                <View style={styles.expirationDropdown}>
                  {[
                    { label: "Never", days: null },
                    { label: "7 days", days: 7 },
                    { label: "30 days", days: 30 },
                  ].map((option) => (
                    <Pressable
                      key={option.label}
                      onPress={() => void updateExpiration(email, option.days)}
                      style={styles.expirationDropdownOption}
                    >
                      <Text style={styles.expirationOptionText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
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
