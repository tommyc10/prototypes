/* Halloween mode in ⌘K, beside the theme, for the whole season. */

import { Command } from 'cmdk';
import { Ghost } from 'lucide-react';
import { inSeason, setHalloween, useHalloween } from '../../hooks/useHalloween';

export function HalloweenCommand({ run }: { run: (fn: () => void) => () => void }) {
  const on = useHalloween();
  if (!inSeason()) return null;
  return (
    <Command.Item value="halloween mode costume ghost pumpkin spooky" onSelect={run(() => setHalloween(!on))}>
      <Ghost size={15} />
      Turn {on ? 'off' : 'on'} Halloween mode
    </Command.Item>
  );
}
