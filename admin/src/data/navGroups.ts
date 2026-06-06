/**
 * admin/src/data/navGroups.ts
 * Definisi menu domain CMS; setiap item bisa dibatasi per-role (RBAC di UI).
 */
import {
  FileText,
  FolderTree,
  Image as ImageIcon,
  Images,
  LayoutDashboard,
  Mail,
  MapPin,
  Megaphone,
  Menu as MenuIcon,
  MessageSquare,
  Newspaper,
  PanelBottom,
  Palette,
  Radio,
  Share2,
  Settings,
  Tags,
  Users,
  Wrench,
} from 'lucide-vue-next';
import type { Component } from 'vue';
import type { UserRole } from '@/types/cms';

/** Satu tautan menu; roles kosong = terlihat semua staf terautentikasi. */
export interface NavItem {
  label: string;
  to: string;
  icon: Component;
  roles?: UserRole[];
}

/** Grup menu berlabel. */
export interface NavGroup {
  label: string;
  items: NavItem[];
}

const EDITOR_UP: UserRole[] = ['ADMIN', 'EDITOR'];
const AUTHOR_UP: UserRole[] = ['ADMIN', 'EDITOR', 'AUTHOR'];
const ADMIN_ONLY: UserRole[] = ['ADMIN'];

export const navGroups: NavGroup[] = [
  {
    label: 'Umum',
    items: [{ label: 'Dashboard', to: '/', icon: LayoutDashboard }],
  },
  {
    label: 'Konten',
    items: [
      { label: 'Berita', to: '/articles', icon: Newspaper },
      { label: 'Laman', to: '/pages', icon: FileText, roles: EDITOR_UP },
      { label: 'Kategori', to: '/categories', icon: FolderTree, roles: EDITOR_UP },
      { label: 'Tag', to: '/tags', icon: Tags, roles: EDITOR_UP },
      { label: 'Media', to: '/media', icon: ImageIcon },
      { label: 'Galeri', to: '/gallery', icon: Images, roles: AUTHOR_UP },
    ],
  },
  {
    label: 'Moderasi',
    items: [
      { label: 'Komentar', to: '/comments', icon: MessageSquare, roles: EDITOR_UP },
      { label: 'Kontak', to: '/contact', icon: Mail, roles: EDITOR_UP },
    ],
  },
  {
    label: 'Siaran & Venue',
    items: [
      { label: 'Live Streaming', to: '/live-streams', icon: Radio, roles: AUTHOR_UP },
      { label: 'Venue', to: '/venue-content', icon: MapPin, roles: EDITOR_UP },
    ],
  },
  {
    label: 'Tampilan Situs',
    items: [
      { label: 'Menu', to: '/menus', icon: MenuIcon, roles: EDITOR_UP },
      { label: 'Branding', to: '/branding', icon: Palette, roles: ADMIN_ONLY },
      { label: 'Footer', to: '/footer-settings', icon: PanelBottom, roles: ADMIN_ONLY },
      { label: 'Sosial', to: '/social', icon: Share2, roles: ADMIN_ONLY },
    ],
  },
  {
    label: 'Monetisasi',
    items: [
      { label: 'Iklan', to: '/ads', icon: Megaphone, roles: EDITOR_UP },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { label: 'Pengguna', to: '/admin/users', icon: Users, roles: ADMIN_ONLY },
      { label: 'Pengaturan', to: '/settings', icon: Settings, roles: ADMIN_ONLY },
      { label: 'Tools', to: '/tools', icon: Wrench, roles: ADMIN_ONLY },
    ],
  },
];
