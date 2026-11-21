import { Check } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";
import { theme } from "../../constants/theme";

type Props = {
    selected: boolean;
    fileName: string;
    onPress: () => void;
};

export default function FileSelectionCheckbox({
    selected,
    fileName,
    onPress,
}: Props) {
    return (
        <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${selected ? "Deselect" : "Select"} ${fileName}`}
            hitSlop={8}
            onPress={(event) => {
                event.stopPropagation();
                onPress();
            }}
            style={[styles.checkbox, selected && styles.checked]}
        >
            {selected && (
                <Check size={14} color={theme.colors.surface} strokeWidth={3} />
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    checkbox: {
        width: 23,
        height: 23,
        borderWidth: 1.5,
        borderColor: theme.colors.mutedText,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surface,
    },
    checked: {
        borderColor: theme.colors.brand,
        backgroundColor: theme.colors.brand,
    },
});
