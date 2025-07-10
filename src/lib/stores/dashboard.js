// src/lib/stores/dashboard.js
import { writable } from 'svelte/store';

// UI State
export const rightSidebarVisible = writable(true);
export const activeChannel = writable('general-discussion');
export const activeRightTab = writable('team');

// User State
export const currentUser = writable(null);

// Messages State
export const messages = writable([]);
export const onlineUsers = writable([]);

// Notifications State
export const notifications = writable([]);
export const unreadCount = writable(0);

// AI State
export const aiActive = writable(true);
export const aiSuggestions = writable([]);

// Functions to update stores
export function toggleRightSidebar() {
    rightSidebarVisible.update(visible => !visible);
}

export function setActiveChannel(channelId) {
    activeChannel.set(channelId);
}

export function setActiveRightTab(tab) {
    activeRightTab.set(tab);
}

export function addMessage(message) {
    messages.update(msgs => [...msgs, message]);
}

export function addNotification(notification) {
    notifications.update(notifs => [notification, ...notifs]);
    unreadCount.update(count => count + 1);
}