import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkTreesStore, linkTreesStore } from "./linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("linkTreesStore", () => {
  beforeEach(() => {
    linkTreesStore.reset();
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockImplementation(() => {});
    vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
  });

  it("should have correct default state", () => {
    const store = useLinkTreesStore();
    expect(store.linkTrees).toEqual([]);
    expect(store.linkTree).toBeNull();
    expect(store.$state.linkTrees).toEqual([]);
    [
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
    ].forEach((flag) => expect(store[flag]).toBe(false));
  });

  it("should update state with setters", () => {
    const store = useLinkTreesStore();
    store.setLinkTrees([{ id: 1 }]);
    expect(store.linkTrees).toEqual([{ id: 1 }]);
    store.setLinkTree({ id: 1 });
    expect(store.linkTree).toEqual({ id: 1 });

    const flags = [
      "IsLinkTree",
      "IsLinkTreeAdd",
      "IsLinkTreeAdded",
      "IsLinkTreeChange",
      "IsLinkTreeChanged",
      "IsLinkTreeChangeCover",
      "IsLinkTreeChangedCover",
      "IsLinkTreeDelete",
      "IsLinkTreeDeleted",
      "IsLinkTreeDeleteAll",
      "IsLinkTreeDeletedAll",
      "IsItemAdd",
      "IsItemAdded",
      "IsItemChange",
      "IsItemChanged",
      "IsItemDelete",
      "IsItemDeleted",
    ];
    flags.forEach((name) => {
      store[`set${name}`](true);
      expect(store[`i${name.slice(1)}`]).toBe(true);
    });
  });

  it("reset should merge a partial state over the defaults", () => {
    linkTreesStore.reset({ isItemAdd: true });
    expect(linkTreesStore.isItemAdd).toBe(true);
    expect(linkTreesStore.linkTrees).toEqual([]);
    linkTreesStore.reset();
    expect(linkTreesStore.isItemAdd).toBe(false);
  });

  describe("asyncSetLinkTrees", () => {
    it("should set link trees on success and pass the isMe flag", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([{ id: 1 }]);
      await linkTreesStore.asyncSetLinkTrees(true);
      expect(spy).toHaveBeenCalledWith(true);
      expect(linkTreesStore.linkTrees).toEqual([{ id: 1 }]);
    });

    it("should default isMe to false", async () => {
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([]);
      await linkTreesStore.asyncSetLinkTrees();
      expect(spy).toHaveBeenCalledWith(false);
    });

    it("should set empty array on error", async () => {
      linkTreesStore.setLinkTrees([{ id: 9 }]);
      vi.spyOn(linkTreeApi, "getLinkTrees").mockRejectedValue(new Error("Err"));
      await linkTreesStore.asyncSetLinkTrees();
      expect(linkTreesStore.linkTrees).toEqual([]);
    });
  });

  describe("asyncSetLinkTree", () => {
    it("should set detail and raise isLinkTree on success", async () => {
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 3 });
      await linkTreesStore.asyncSetLinkTree(3);
      expect(linkTreesStore.linkTree).toEqual({ id: 3 });
      expect(linkTreesStore.isLinkTree).toBe(true);
    });

    it("should set null and still raise isLinkTree on error", async () => {
      linkTreesStore.setLinkTree({ id: 3 });
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockRejectedValue(new Error("Err"));
      await linkTreesStore.asyncSetLinkTree(3);
      expect(linkTreesStore.linkTree).toBeNull();
      expect(linkTreesStore.isLinkTree).toBe(true);
    });
  });

  // [nama aksi, nama method API, argumen aksi, flag selesai, flag berhasil, pesan bawaan]
  const mutations = [
    ["asyncSetIsLinkTreeAdd", "postLinkTree", ["T", "public", "D"], "isLinkTreeAdd", "isLinkTreeAdded", "Link tree berhasil ditambahkan!"],
    ["asyncSetIsLinkTreeChange", "putLinkTree", [1, "T", "public", "D"], "isLinkTreeChange", "isLinkTreeChanged", "Link tree berhasil diperbarui!"],
    ["asyncSetIsLinkTreeChangeCover", "postLinkTreeCover", [1, new File(["x"], "c.jpg")], "isLinkTreeChangeCover", "isLinkTreeChangedCover", "Cover berhasil diperbarui!"],
    ["asyncSetIsLinkTreeDelete", "deleteLinkTree", [1], "isLinkTreeDelete", "isLinkTreeDeleted", "Link tree berhasil dihapus!"],
    ["asyncSetIsLinkTreeDeleteAll", "deleteAllLinkTrees", [], "isLinkTreeDeleteAll", "isLinkTreeDeletedAll", "Semua link tree berhasil dihapus!"],
    ["asyncSetIsItemAdd", "postItem", [1, "T", "https://a.dev"], "isItemAdd", "isItemAdded", "Tautan berhasil ditambahkan!"],
    ["asyncSetIsItemChange", "putItem", [1, 2, "T", "https://a.dev"], "isItemChange", "isItemChanged", "Tautan berhasil diperbarui!"],
    ["asyncSetIsItemDelete", "deleteItem", [1, 2], "isItemDelete", "isItemDeleted", "Tautan berhasil dihapus!"],
  ];

  describe.each(mutations)("%s", (action, apiMethod, args, doneFlag, okFlag, fallback) => {
    it("should call the API with the given arguments", async () => {
      const spy = vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue("ok");
      await linkTreesStore[action](...args);
      expect(spy).toHaveBeenCalledWith(...args);
    });

    it("should show the server message and set flags on success", async () => {
      vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue("Pesan dari server");
      await linkTreesStore[action](...args);
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Pesan dari server");
      expect(linkTreesStore[okFlag]).toBe(true);
      expect(linkTreesStore[doneFlag]).toBe(true);
    });

    it("should use the fallback message when the API returns no text", async () => {
      vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue({ id: 1 });
      await linkTreesStore[action](...args);
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(fallback);

      vi.spyOn(linkTreeApi, apiMethod).mockResolvedValue("");
      await linkTreesStore[action](...args);
      expect(toolsHelper.showSuccessDialog).toHaveBeenLastCalledWith(fallback);
    });

    it("should show the error and keep success flag false on failure", async () => {
      vi.spyOn(linkTreeApi, apiMethod).mockRejectedValue(new Error("Gagal"));
      await linkTreesStore[action](...args);
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Gagal");
      expect(linkTreesStore[okFlag]).toBe(false);
      expect(linkTreesStore[doneFlag]).toBe(true);
    });
  });
});
