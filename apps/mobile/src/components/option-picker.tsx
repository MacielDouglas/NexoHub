import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type PickerOption<T extends string | number> = {
  value: T;
  label: string;
  group?: string;
};

type Props<T extends string | number> = {
  visible: boolean;
  title: string;
  options: readonly PickerOption<T>[];
  selected: T | null;
  onSelect: (value: T | null) => void;
  onClose: () => void;
  placeholder?: string;
};

export function OptionPicker<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
  placeholder,
}: Props<T>) {
  const theme = useTheme();

  const groups = new Map<string, PickerOption<T>[]>();
  const ungrouped: PickerOption<T>[] = [];
  for (const opt of options) {
    if (opt.group) {
      const list = groups.get(opt.group) ?? [];
      list.push(opt);
      groups.set(opt.group, list);
    } else {
      ungrouped.push(opt);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <ThemedView
          type="backgroundElement"
          style={[styles.sheet, { borderColor: theme.border }]}
        >
          <ThemedText type="smallBold" style={styles.sheetTitle}>
            {title}
          </ThemedText>
          <ScrollView style={styles.list}>
            <Pressable
              onPress={() => {
                onSelect(null);
                onClose();
              }}
              style={({ pressed }) => [
                styles.option,
                selected == null && { backgroundColor: theme.backgroundSelected },
                pressed && { opacity: 0.8 },
              ]}
            >
              <ThemedText type="small" themeColor="textSecondary">
                {placeholder ?? '—'}
              </ThemedText>
            </Pressable>

            {ungrouped.map((opt) => (
              <Pressable
                key={`${opt.group ?? ''}:${opt.value}`}
                onPress={() => {
                  onSelect(opt.value);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.option,
                  selected === opt.value && {
                    backgroundColor: theme.backgroundSelected,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <ThemedText
                  type="small"
                  themeColor={selected === opt.value ? 'primary' : 'text'}
                  style={selected === opt.value && styles.optionSelected}
                >
                  {opt.label}
                </ThemedText>
              </Pressable>
            ))}

            {Array.from(groups.entries()).map(([group, list]) => (
              <View key={group}>
                <ThemedText
                  type="smallBold"
                  themeColor="textSecondary"
                  style={styles.groupTitle}
                >
                  {group}
                </ThemedText>
                {list.map((opt) => (
                  <Pressable
                    key={`${group}:${opt.value}`}
                    onPress={() => {
                      onSelect(opt.value);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      selected === opt.value && {
                        backgroundColor: theme.backgroundSelected,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <ThemedText
                      type="small"
                      themeColor={selected === opt.value ? 'primary' : 'text'}
                      style={selected === opt.value && styles.optionSelected}
                    >
                      {opt.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ))}
          </ScrollView>
        </ThemedView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    maxHeight: '70%',
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
  },
  sheetTitle: {
    marginBottom: Spacing.two,
  },
  list: {
    flexGrow: 0,
  },
  option: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
  },
  optionSelected: {
    fontWeight: '700',
  },
  groupTitle: {
    marginTop: Spacing.two,
    marginBottom: Spacing.half,
    paddingHorizontal: Spacing.three,
  },
});
