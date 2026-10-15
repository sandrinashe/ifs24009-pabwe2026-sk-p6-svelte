import { describe, it, expect, vi, beforeEach } from "vitest";
import linkTreeApi from "./linkTreeApi";
import apiHelper from "../../../helpers/apiHelper";

function mockResponse(body) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({
    json: async () => body,
  });
}

describe("linkTreeApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postLinkTree", () => {
    it("should create link tree and return data", async () => {
      const spy = mockResponse({ status: "success", data: { link_tree_id: 10 } });

      const res = await linkTreeApi.postLinkTree("Judul", "public", "Deskripsi");

      expect(res).toEqual({ link_tree_id: 10 });
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/link-trees/`);
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
      expect(JSON.parse(options.body)).toEqual({
        title: "Judul",
        type: "public",
        description: "Deskripsi",
      });
    });

    it("should throw server message on failure", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(linkTreeApi.postLinkTree("", "x", "")).rejects.toThrow("Data tidak valid");
    });

    it("should throw fallback message when server message missing", async () => {
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postLinkTree("", "x", "")).rejects.toThrow(
        "Gagal menambahkan link tree"
      );
    });
  });

  describe("postLinkTreeCover", () => {
    it("should upload cover as FormData and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah cover" });
      const file = new File(["x"], "cover.png", { type: "image/png" });

      const msg = await linkTreeApi.postLinkTreeCover(3, file);

      expect(msg).toBe("Berhasil mengubah cover");
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/link-trees/3/cover`);
      expect(options.method).toBe("POST");
      expect(options.body.get("cover").name).toBe("cover.png");
    });

    it("should fall back to default file name for blobs", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      await linkTreeApi.postLinkTreeCover(3, new Blob(["x"], { type: "image/png" }));
      expect(spy.mock.calls[0][1].body.get("cover").name).toBe("cover.jpg");
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail", message: "Format tidak didukung" });
      await expect(
        linkTreeApi.postLinkTreeCover(3, new File(["x"], "c.jpg"))
      ).rejects.toThrow("Format tidak didukung");
    });

    it("should throw fallback on failure without message", async () => {
      mockResponse({ status: "fail" });
      await expect(
        linkTreeApi.postLinkTreeCover(3, new File(["x"], "c.jpg"))
      ).rejects.toThrow("Gagal mengubah cover");
    });
  });

  describe("putLinkTree", () => {
    it("should update link tree and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });

      const msg = await linkTreeApi.putLinkTree(5, "T", "private", "D");

      expect(msg).toBe("Berhasil mengubah data");
      const [, options] = spy.mock.calls[0];
      expect(options.method).toBe("PUT");
      expect(JSON.parse(options.body)).toEqual({ title: "T", type: "private", description: "D" });
    });

    it("should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Gagal total" });
      await expect(linkTreeApi.putLinkTree(5, "", "", "")).rejects.toThrow("Gagal total");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.putLinkTree(5, "", "", "")).rejects.toThrow(
        "Gagal mengubah link tree"
      );
    });
  });

  describe("getLinkTrees", () => {
    it("should fetch all link trees", async () => {
      const spy = mockResponse({
        status: "success",
        data: { link_trees: [{ id: 1 }, { id: 2 }] },
      });

      const res = await linkTreeApi.getLinkTrees();

      expect(res).toEqual([{ id: 1 }, { id: 2 }]);
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/`);
    });

    it("should request only own data when isMe is true", async () => {
      const spy = mockResponse({ status: "success", data: { link_trees: [{ id: 1 }] } });

      await linkTreeApi.getLinkTrees(true);

      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/?is_me=1`);
    });

    it("should return empty array when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await linkTreeApi.getLinkTrees()).toEqual([]);
    });

    it("should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow("Unauthenticated.");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow(
        "Gagal mengambil data link tree"
      );
    });
  });

  describe("getLinkTreeById", () => {
    it("should return link tree detail", async () => {
      const spy = mockResponse({
        status: "success",
        data: { link_tree: { id: 4, items: [] } },
      });

      expect(await linkTreeApi.getLinkTreeById(4)).toEqual({ id: 4, items: [] });
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/4`);
    });

    it("should return undefined when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await linkTreeApi.getLinkTreeById(4)).toBeUndefined();
    });

    it("should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Tidak ditemukan" });
      await expect(linkTreeApi.getLinkTreeById(4)).rejects.toThrow("Tidak ditemukan");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.getLinkTreeById(4)).rejects.toThrow(
        "Gagal mengambil detail link tree"
      );
    });
  });

  describe("deleteLinkTree", () => {
    it("should delete link tree and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });

      expect(await linkTreeApi.deleteLinkTree(8)).toBe("Berhasil menghapus data");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/8`);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Ditolak" });
      await expect(linkTreeApi.deleteLinkTree(8)).rejects.toThrow("Ditolak");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteLinkTree(8)).rejects.toThrow("Gagal menghapus link tree");
    });
  });

  describe("deleteAllLinkTrees", () => {
    it("should delete all link trees", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });

      expect(await linkTreeApi.deleteAllLinkTrees()).toBe("Berhasil menghapus data");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/`);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Unauthenticated." });
      await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow("Unauthenticated.");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow(
        "Gagal menghapus semua link tree"
      );
    });
  });

  describe("items", () => {
    it("postItem should add an item and return data", async () => {
      const spy = mockResponse({ status: "success", data: { item_id: 7 } });

      const res = await linkTreeApi.postItem(2, "Svelte", "https://svelte.dev");

      expect(res).toEqual({ item_id: 7 });
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/link-trees/2/items`);
      expect(options.method).toBe("POST");
      expect(JSON.parse(options.body)).toEqual({ title: "Svelte", url: "https://svelte.dev" });
    });

    it("postItem should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "URL tidak valid" });
      await expect(linkTreeApi.postItem(2, "a", "b")).rejects.toThrow("URL tidak valid");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.postItem(2, "a", "b")).rejects.toThrow("Gagal menambahkan tautan");
    });

    it("putItem should update an item and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil mengubah data" });

      const msg = await linkTreeApi.putItem(2, 7, "Judul", "https://a.dev");

      expect(msg).toBe("Berhasil mengubah data");
      const [url, options] = spy.mock.calls[0];
      expect(url).toBe(`${DELCOM_BASEURL}/link-trees/2/items/7`);
      expect(options.method).toBe("PUT");
    });

    it("putItem should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Salah" });
      await expect(linkTreeApi.putItem(2, 7, "a", "b")).rejects.toThrow("Salah");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.putItem(2, 7, "a", "b")).rejects.toThrow("Gagal mengubah tautan");
    });

    it("deleteItem should delete an item and return message", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil menghapus data" });

      expect(await linkTreeApi.deleteItem(2, 7)).toBe("Berhasil menghapus data");
      expect(spy.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/link-trees/2/items/7`);
      expect(spy.mock.calls[0][1].method).toBe("DELETE");
    });

    it("deleteItem should throw with message or fallback", async () => {
      mockResponse({ status: "fail", message: "Ditolak" });
      await expect(linkTreeApi.deleteItem(2, 7)).rejects.toThrow("Ditolak");
      mockResponse({ status: "fail" });
      await expect(linkTreeApi.deleteItem(2, 7)).rejects.toThrow("Gagal menghapus tautan");
    });
  });
});
