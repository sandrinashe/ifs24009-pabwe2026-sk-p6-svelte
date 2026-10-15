import { writable } from "svelte/store";
import linkTreeApi from "../api/linkTreeApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

// Setiap aksi mutasi memakai pasangan bendera: `isX` (aksi selesai dijalankan)
// dan `isXed` (aksi berhasil). Komponen membaca bendera ini lalu meresetnya.
const FLAGS = [
  "isLinkTree",
  "isLinkTreeAdd",
  "isLinkTreeAdded",
  "isLinkTreeChange",
  "isLinkTreeChanged",
  "isLinkTreeChangeCover",
  "isLinkTreeChangedCover",
  "isLinkTreeDelete",
  "isLinkTreeDeleted",
  "isLinkTreeDeleteAll",
  "isLinkTreeDeletedAll",
  "isItemAdd",
  "isItemAdded",
  "isItemChange",
  "isItemChanged",
  "isItemDelete",
  "isItemDeleted",
];

function createLinkTreesStore() {
  const initial = {
    linkTrees: [],
    linkTree: null,
    ...Object.fromEntries(FLAGS.map((flag) => [flag, false])),
  };

  let currentState = { ...initial };
  const innerStore = writable(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  function set(key, value) {
    innerStore.update((s) => ({ ...s, [key]: value }));
  }

  // Menjalankan aksi API, menampilkan dialog, dan mengatur pasangan bendera.
  async function mutate(action, doneFlag, okFlag, successFallback) {
    try {
      const message = await action();
      showSuccessDialog(
        typeof message === "string" && message ? message : successFallback
      );
      set(okFlag, true);
    } catch (error) {
      showErrorDialog(error.message);
      set(okFlag, false);
    } finally {
      set(doneFlag, true);
    }
  }

  return {
    subscribe: innerStore.subscribe,
    get linkTrees() { return currentState.linkTrees; },
    get linkTree() { return currentState.linkTree; },
    get isLinkTree() { return currentState.isLinkTree; },
    get isLinkTreeAdd() { return currentState.isLinkTreeAdd; },
    get isLinkTreeAdded() { return currentState.isLinkTreeAdded; },
    get isLinkTreeChange() { return currentState.isLinkTreeChange; },
    get isLinkTreeChanged() { return currentState.isLinkTreeChanged; },
    get isLinkTreeChangeCover() { return currentState.isLinkTreeChangeCover; },
    get isLinkTreeChangedCover() { return currentState.isLinkTreeChangedCover; },
    get isLinkTreeDelete() { return currentState.isLinkTreeDelete; },
    get isLinkTreeDeleted() { return currentState.isLinkTreeDeleted; },
    get isLinkTreeDeleteAll() { return currentState.isLinkTreeDeleteAll; },
    get isLinkTreeDeletedAll() { return currentState.isLinkTreeDeletedAll; },
    get isItemAdd() { return currentState.isItemAdd; },
    get isItemAdded() { return currentState.isItemAdded; },
    get isItemChange() { return currentState.isItemChange; },
    get isItemChanged() { return currentState.isItemChanged; },
    get isItemDelete() { return currentState.isItemDelete; },
    get isItemDeleted() { return currentState.isItemDeleted; },
    get $state() { return currentState; },
    reset(state = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setLinkTrees(linkTrees) { set("linkTrees", linkTrees); },
    setLinkTree(linkTree) { set("linkTree", linkTree); },
    setIsLinkTree(status) { set("isLinkTree", status); },
    setIsLinkTreeAdd(status) { set("isLinkTreeAdd", status); },
    setIsLinkTreeAdded(status) { set("isLinkTreeAdded", status); },
    setIsLinkTreeChange(status) { set("isLinkTreeChange", status); },
    setIsLinkTreeChanged(status) { set("isLinkTreeChanged", status); },
    setIsLinkTreeChangeCover(status) { set("isLinkTreeChangeCover", status); },
    setIsLinkTreeChangedCover(status) { set("isLinkTreeChangedCover", status); },
    setIsLinkTreeDelete(status) { set("isLinkTreeDelete", status); },
    setIsLinkTreeDeleted(status) { set("isLinkTreeDeleted", status); },
    setIsLinkTreeDeleteAll(status) { set("isLinkTreeDeleteAll", status); },
    setIsLinkTreeDeletedAll(status) { set("isLinkTreeDeletedAll", status); },
    setIsItemAdd(status) { set("isItemAdd", status); },
    setIsItemAdded(status) { set("isItemAdded", status); },
    setIsItemChange(status) { set("isItemChange", status); },
    setIsItemChanged(status) { set("isItemChanged", status); },
    setIsItemDelete(status) { set("isItemDelete", status); },
    setIsItemDeleted(status) { set("isItemDeleted", status); },
    async asyncSetLinkTrees(isMe = false) {
      try {
        this.setLinkTrees(await linkTreeApi.getLinkTrees(isMe));
      } catch {
        this.setLinkTrees([]);
      }
    },
    async asyncSetLinkTree(linkTreeId) {
      try {
        this.setLinkTree(await linkTreeApi.getLinkTreeById(linkTreeId));
      } catch {
        this.setLinkTree(null);
      } finally {
        this.setIsLinkTree(true);
      }
    },
    asyncSetIsLinkTreeAdd(title, type, description) {
      return mutate(
        () => linkTreeApi.postLinkTree(title, type, description),
        "isLinkTreeAdd",
        "isLinkTreeAdded",
        "Link tree berhasil ditambahkan!"
      );
    },
    asyncSetIsLinkTreeChange(linkTreeId, title, type, description) {
      return mutate(
        () => linkTreeApi.putLinkTree(linkTreeId, title, type, description),
        "isLinkTreeChange",
        "isLinkTreeChanged",
        "Link tree berhasil diperbarui!"
      );
    },
    asyncSetIsLinkTreeChangeCover(linkTreeId, cover) {
      return mutate(
        () => linkTreeApi.postLinkTreeCover(linkTreeId, cover),
        "isLinkTreeChangeCover",
        "isLinkTreeChangedCover",
        "Cover berhasil diperbarui!"
      );
    },
    asyncSetIsLinkTreeDelete(linkTreeId) {
      return mutate(
        () => linkTreeApi.deleteLinkTree(linkTreeId),
        "isLinkTreeDelete",
        "isLinkTreeDeleted",
        "Link tree berhasil dihapus!"
      );
    },
    asyncSetIsLinkTreeDeleteAll() {
      return mutate(
        () => linkTreeApi.deleteAllLinkTrees(),
        "isLinkTreeDeleteAll",
        "isLinkTreeDeletedAll",
        "Semua link tree berhasil dihapus!"
      );
    },
    asyncSetIsItemAdd(linkTreeId, title, url) {
      return mutate(
        () => linkTreeApi.postItem(linkTreeId, title, url),
        "isItemAdd",
        "isItemAdded",
        "Tautan berhasil ditambahkan!"
      );
    },
    asyncSetIsItemChange(linkTreeId, itemId, title, url) {
      return mutate(
        () => linkTreeApi.putItem(linkTreeId, itemId, title, url),
        "isItemChange",
        "isItemChanged",
        "Tautan berhasil diperbarui!"
      );
    },
    asyncSetIsItemDelete(linkTreeId, itemId) {
      return mutate(
        () => linkTreeApi.deleteItem(linkTreeId, itemId),
        "isItemDelete",
        "isItemDeleted",
        "Tautan berhasil dihapus!"
      );
    },
  };
}

export const linkTreesStore = createLinkTreesStore();
export const useLinkTreesStore = () => linkTreesStore;
export default linkTreesStore;
