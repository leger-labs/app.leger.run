/**
 * Command Palette Component
 * Global search/command interface triggered by Ctrl+K / Cmd+K
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Settings, Package, Cpu, Rocket, ShoppingBag } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Find..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/models')}>
            <Cpu className="mr-2 h-4 w-4" />
            <span>Models</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/providers')}>
            <Package className="mr-2 h-4 w-4" />
            <span>Providers</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/releases')}>
            <Rocket className="mr-2 h-4 w-4" />
            <span>Releases</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/marketplace')}>
            <ShoppingBag className="mr-2 h-4 w-4" />
            <span>Marketplace</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
