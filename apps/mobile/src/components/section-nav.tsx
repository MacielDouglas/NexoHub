import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SectionNavItem = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: string;
};

type Props = {
  items: readonly SectionNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  ariaLabel?: string;
};

export function SectionNav({ items, activeId, onSelect, ariaLabel }: Props) {
  const theme = useTheme();

  return (
    <ThemedView
      type="backgroundElement"
      style={[styles.container, { borderColor: theme.border }]}
      accessibilityLabel={ariaLabel}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => [
              styles.item,
              active && { backgroundColor: theme.primary },
              pressed && { opacity: 0.8 },
            ]}
          >
            <ThemedText
              style={[
                styles.itemIcon,
                active ? { color: '#ffffff' } : { color: theme.primary },
              ]}
            >
              {item.icon}
            </ThemedText>
            <ThemedText
              type="small"
              numberOfLines={1}
              style={[
                styles.itemLabel,
                active
                  ? { color: '#ffffff', fontWeight: '700' }
                  : { color: theme.text },
              ]}
            >
              {item.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  item: {
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 72,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
    gap: Spacing.half,
  },
  itemIcon: { fontSize: 22, fontWeight: '700' },
  itemLabel: { fontSize: 12 },
});