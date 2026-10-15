import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as routerModule from "../../../router";
import { linkTreesStore } from "../states/linkTreesStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Abdullah" };

const items = [
  { id: 11, link_tree_id: 1, title: "Svelte Docs", url: "https://svelte.dev", created_at: "", updated_at: "" },
  { id: 12, link_tree_id: 1, title: "Vite", url: "https://vite.dev", created_at: "", updated_at: "" },
];

const linkTree = {
  id: 1,
  user_id: 1,
  title: "Belajar Svelte",
  type: "public",
  description: "Kumpulan sumber belajar",
  cover: "http://img/1.jpg",
  created_at: "2024-10-06T01:27:37.000000Z",
  updated_at: "2024-10-06T01:28:31.000000Z",
  author: { name: "Abdullah", photo: "http://img/u.png" },
  items,
};

function setup({ props = { linkTreeId: "1" }, state = {} } = {}) {
  const loaded = "linkTree" in state ? state.linkTree : linkTree;
  // Meniru store asli: data detail diisi ulang setelah proses ambil data selesai.
  vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(async () => {
    linkTreesStore.setLinkTree(loaded);
  });
  vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockImplementation(() => Promise.resolve());
  const result = renderWithProviders(DetailPage, {
    props,
    preloadedState: { profile, linkTree, ...state },
  });
  return result;
}

describe("DetailPage (link tree)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch the link tree on mount and show a spinner until it is loaded", async () => {
    const { wrapper } = setup({ state: { linkTree: null } });
    await tick();

    expect(linkTreesStore.asyncSetLinkTree).toHaveBeenCalledWith("1");
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("should show a spinner when the profile is not ready", () => {
    const { wrapper } = setup({ state: { profile: null } });
    expect(wrapper.find(".animate-spin").exists()).toBe(true);
  });

  it("should render the detail with description, author and items", async () => {
    const { wrapper } = setup();
    await tick();

    expect(wrapper.text()).toContain("Belajar Svelte");
    expect(wrapper.text()).toContain("Publik");
    expect(wrapper.text()).toContain("Oleh Abdullah");
    expect(wrapper.find('[data-testid="link-tree-description"]').text()).toBe(
      "Kumpulan sumber belajar"
    );
    expect(wrapper.find('[data-testid="items-count"]').text()).toBe("(2)");
    expect(wrapper.find('[data-testid="item-link-11"]').attributes("href")).toBe(
      "https://svelte.dev"
    );
    expect(wrapper.find('[data-testid="item-link-11"]').attributes("target")).toBe("_blank");
    expect(wrapper.findAll("img").length).toBe(2);
  });

  it("should render the other access types without cover or author photo", async () => {
    const { wrapper } = setup({
      state: {
        linkTree: { ...linkTree, type: "private", cover: null, author: { name: "Budi", photo: null } },
      },
    });
    await tick();

    expect(wrapper.text()).toContain("Privat");
    expect(wrapper.findAll("img").length).toBe(0);
  });

  it("should render the unlisted type", async () => {
    const { wrapper } = setup({ state: { linkTree: { ...linkTree, type: "unlisted" } } });
    await tick();
    expect(wrapper.text()).toContain("Tidak Terdaftar");
  });

  it("should show an empty message when there are no items", async () => {
    const { wrapper } = setup({ state: { linkTree: { ...linkTree, items: [] } } });
    await tick();
    expect(wrapper.find('[data-testid="items-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="items-count"]').text()).toBe("(0)");
  });

  it("should treat a missing items field as empty", async () => {
    const { items: _omit, ...withoutItems } = linkTree;
    const { wrapper } = setup({ state: { linkTree: withoutItems } });
    await tick();
    expect(wrapper.find('[data-testid="items-empty"]').exists()).toBe(true);
  });

  it("should hide owner actions for other users", async () => {
    const { wrapper } = setup({ state: { linkTree: { ...linkTree, user_id: 99 } } });
    await tick();

    expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="edit-detail-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-detail-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="add-item-btn"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="edit-item-11"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-item-11"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="item-link-11"]').exists()).toBe(true);
  });

  it("should navigate back to the list", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { wrapper } = setup();
    await tick();
    navSpy.mockClear();

    await wrapper.find('[data-testid="back-to-link-trees-link"]').trigger("click");

    expect(navSpy).toHaveBeenCalledWith("/");
  });

  it("should redirect to the list when the link tree cannot be loaded", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { linkTreesStore: store } = setup({ state: { linkTree: null } });
    await tick();
    navSpy.mockClear();

    store.setIsLinkTree(true);
    await tick();

    expect(navSpy).toHaveBeenCalledWith("/");
    expect(store.isLinkTree).toBe(false);
  });

  it("should stay on the page when the link tree is loaded", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { linkTreesStore: store } = setup();
    await tick();
    navSpy.mockClear();

    store.setLinkTree(linkTree);
    store.setIsLinkTree(true);
    await tick();

    expect(navSpy).not.toHaveBeenCalled();
    expect(store.isLinkTree).toBe(false);
  });

  it("should refetch when the route parameter changes", async () => {
    const { rerender } = setup();
    await tick();
    linkTreesStore.asyncSetLinkTree.mockClear();

    await rerender({ linkTreeId: "2" });
    await tick();

    expect(linkTreesStore.asyncSetLinkTree).toHaveBeenCalledWith("2");
  });

  it("should open and close the cover modal", async () => {
    const { wrapper } = setup();
    await tick();

    await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
  });

  it("should open and close the edit modal", async () => {
    const { wrapper } = setup();
    await tick();

    await wrapper.find('[data-testid="edit-detail-btn"]').trigger("click");
    await tick();
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
  });

  it("should open the item modal for adding and for editing", async () => {
    const { wrapper } = setup();
    await tick();

    await wrapper.find('[data-testid="add-item-btn"]').trigger("click");
    await tick();
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-item-12"]').trigger("click");
    await tick();
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Vite");
  });

  it("should delete the link tree after confirmation and go back to the list", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { wrapper, linkTreesStore: store } = setup();
    const deleteSpy = vi.spyOn(store, "asyncSetIsLinkTreeDelete").mockResolvedValue();
    await tick();
    navSpy.mockClear();

    await wrapper.find('[data-testid="delete-detail-btn"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith(1);
    expect(navSpy).not.toHaveBeenCalled();

    store.setIsLinkTreeDeleted(true);
    store.setIsLinkTreeDelete(true);
    await tick();
    expect(navSpy).toHaveBeenCalledWith("/");
    expect(store.isLinkTreeDeleted).toBe(false);
  });

  it("should not delete the link tree when the confirmation is declined", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });
    const { wrapper, linkTreesStore: store } = setup();
    const deleteSpy = vi.spyOn(store, "asyncSetIsLinkTreeDelete").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="delete-detail-btn"]').trigger("click");
    await tick();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should stay on the page when deleting the link tree fails", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { linkTreesStore: store } = setup();
    await tick();
    navSpy.mockClear();

    store.setIsLinkTreeDeleted(false);
    store.setIsLinkTreeDelete(true);
    await tick();

    expect(navSpy).not.toHaveBeenCalled();
    expect(store.isLinkTreeDelete).toBe(false);
  });

  it("should delete an item after confirmation and refresh the detail", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });
    const { wrapper, linkTreesStore: store } = setup();
    const deleteSpy = vi.spyOn(store, "asyncSetIsItemDelete").mockResolvedValue();
    await tick();
    linkTreesStore.asyncSetLinkTree.mockClear();

    await wrapper.find('[data-testid="delete-item-11"]').trigger("click");
    await tick();
    expect(deleteSpy).toHaveBeenCalledWith(1, 11);

    store.setIsItemDeleted(true);
    store.setIsItemDelete(true);
    await tick();
    expect(linkTreesStore.asyncSetLinkTree).toHaveBeenCalledWith(1);
    expect(store.isItemDeleted).toBe(false);
  });

  it("should not delete an item when the confirmation is declined", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });
    const { wrapper, linkTreesStore: store } = setup();
    const deleteSpy = vi.spyOn(store, "asyncSetIsItemDelete").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="delete-item-11"]').trigger("click");
    await tick();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should not refresh the detail when deleting an item fails", async () => {
    const { linkTreesStore: store } = setup();
    await tick();
    linkTreesStore.asyncSetLinkTree.mockClear();

    store.setIsItemDeleted(false);
    store.setIsItemDelete(true);
    await tick();

    expect(linkTreesStore.asyncSetLinkTree).not.toHaveBeenCalled();
    expect(store.isItemDelete).toBe(false);
  });
});
