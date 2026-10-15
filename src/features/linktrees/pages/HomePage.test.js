import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as routerModule from "../../../router";
import { linkTreesStore } from "../states/linkTreesStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Abdullah" };

const linkTrees = [
  {
    id: 1,
    user_id: 1,
    title: "Belajar Svelte",
    type: "public",
    description: "Kumpulan sumber belajar",
    cover: "http://img/1.jpg",
    created_at: "2024-10-06T01:27:37.000000Z",
    updated_at: "2024-10-06T01:28:31.000000Z",
    author: { name: "Abdullah", photo: null },
    total_links: 3,
  },
  {
    id: 2,
    user_id: 2,
    title: "Tools Desain",
    type: "unlisted",
    description: "Daftar aplikasi desain",
    cover: null,
    created_at: "2024-10-06T01:27:37.000000Z",
    updated_at: "2024-10-06T01:28:31.000000Z",
    author: { name: "Budi", photo: null },
    total_links: 2,
  },
  {
    id: 3,
    user_id: 1,
    title: "Catatan Pribadi",
    type: "private",
    description: "Hanya untuk saya",
    cover: null,
    created_at: "2024-10-06T01:27:37.000000Z",
    updated_at: "2024-10-06T01:28:31.000000Z",
    author: { name: "Abdullah", photo: null },
    total_links: 0,
  },
];

function setup(state = {}) {
  vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockResolvedValue();
  return renderWithProviders(HomePage, {
    preloadedState: { profile, linkTrees, ...state },
  });
}

describe("HomePage (link trees)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should render nothing when there is no profile", () => {
    const { wrapper } = setup({ profile: null });
    expect(wrapper.text()).not.toContain("Semua Link Tree");
  });

  it("should load all link trees on mount and show the cards", async () => {
    const { wrapper } = setup();
    await tick();

    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenCalledWith(false);
    expect(wrapper.text()).toContain("Semua Link Tree");
    expect(wrapper.find('[data-testid="link-tree-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-tree-card-2"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-tree-card-3"]').exists()).toBe(true);
  });

  it("should show statistics", () => {
    const { wrapper } = setup();
    expect(wrapper.find('[data-testid="stat-total"]').text()).toBe("3");
    expect(wrapper.find('[data-testid="stat-mine"]').text()).toBe("2");
    expect(wrapper.find('[data-testid="stat-links"]').text()).toBe("5");
  });

  it("should render the type badge and cover for each card", () => {
    const { wrapper } = setup();
    expect(wrapper.find('[data-testid="link-tree-card-1"]').text()).toContain("Publik");
    expect(wrapper.find('[data-testid="link-tree-card-2"]').text()).toContain("Tidak Terdaftar");
    expect(wrapper.find('[data-testid="link-tree-card-3"]').text()).toContain("Privat");
    expect(wrapper.find('[data-testid="link-tree-card-1"] img').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-tree-card-2"] img').exists()).toBe(false);
    expect(wrapper.find('[data-testid="link-tree-card-2"]').text()).toContain("Budi");
    expect(wrapper.find('[data-testid="link-tree-card-2"]').text()).toContain("2 tautan");
  });

  it("should show a loading state while the list is loading and empty", async () => {
    vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile, linkTrees: [] },
    });
    await tick();
    expect(wrapper.text()).toContain("Memuat daftar link tree...");
  });

  it("should show the list instead of the loader when data already exists", async () => {
    vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockReturnValue(new Promise(() => {}));
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile, linkTrees },
    });
    await tick();
    expect(wrapper.text()).not.toContain("Memuat daftar link tree...");
    expect(wrapper.find('[data-testid="link-tree-card-1"]').exists()).toBe(true);
  });

  it("should show an empty state when nothing is found", async () => {
    const { wrapper } = setup({ linkTrees: [] });
    await tick();
    expect(wrapper.text()).toContain("Belum ada link tree yang cocok.");
    expect(wrapper.find('[data-testid="delete-all-btn"]').exists()).toBe(false);
  });

  it("should treat a missing list as empty", async () => {
    const { wrapper } = setup({ linkTrees: null });
    await tick();
    expect(wrapper.text()).toContain("Belum ada link tree yang cocok.");
  });

  it("should search by title and description", async () => {
    const { wrapper } = setup();
    const input = wrapper.find('[data-testid="search-link-tree-input"]');

    await input.setValue("svelte");
    expect(wrapper.find('[data-testid="link-tree-card-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-tree-card-2"]').exists()).toBe(false);

    await input.setValue("aplikasi desain");
    expect(wrapper.find('[data-testid="link-tree-card-1"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="link-tree-card-2"]').exists()).toBe(true);

    await input.setValue("tidak ada");
    expect(wrapper.text()).toContain("Belum ada link tree yang cocok.");

    await input.setValue("   ");
    expect(wrapper.find('[data-testid="link-tree-card-3"]').exists()).toBe(true);
  });

  it("should reload when the filter changes", async () => {
    const { wrapper } = setup();
    await tick();
    linkTreesStore.asyncSetLinkTrees.mockClear();

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenCalledWith(true);

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenCalledTimes(1);

    await wrapper.find('[data-testid="filter-all-btn"]').trigger("click");
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenLastCalledWith(false);
  });

  it("should navigate to the detail page", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});
    const { wrapper } = setup();

    await wrapper.find('[data-testid="view-link-tree-2"]').trigger("click");

    expect(navSpy).toHaveBeenCalledWith("/link-trees/2");
  });

  it("should only show edit and delete actions for the owner", () => {
    const { wrapper } = setup();
    expect(wrapper.find('[data-testid="edit-link-tree-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="delete-link-tree-1"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-link-tree-2"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="delete-link-tree-2"]').exists()).toBe(false);
  });

  it("should open and close the add modal", async () => {
    const { wrapper } = setup();
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="add-link-tree-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(false);
  });

  it("should open the change modal with the selected link tree and close it", async () => {
    const { wrapper } = setup();

    await wrapper.find('[data-testid="edit-link-tree-3"]').trigger("click");
    await tick();

    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="edit-link-tree-title-input"]').element.value).toBe(
      "Catatan Pribadi"
    );

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
  });

  it("should delete a link tree after confirmation", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });
    const { wrapper } = setup();
    const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockResolvedValue();

    await wrapper.find('[data-testid="delete-link-tree-1"]').trigger("click");
    await tick();

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should not delete a link tree when the confirmation is declined", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });
    const { wrapper } = setup();
    const deleteSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete").mockResolvedValue();

    await wrapper.find('[data-testid="delete-link-tree-1"]').trigger("click");
    await tick();

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should delete all own link trees after confirmation", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });
    const { wrapper } = setup();
    const deleteAllSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeDeleteAll")
      .mockResolvedValue();

    await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
    await tick();

    expect(deleteAllSpy).toHaveBeenCalled();
  });

  it("should not delete all link trees when the confirmation is declined", async () => {
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });
    const { wrapper } = setup();
    const deleteAllSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeDeleteAll")
      .mockResolvedValue();

    await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
    await tick();

    expect(deleteAllSpy).not.toHaveBeenCalled();
  });

  it("should reload after a successful delete and ignore a failed one", async () => {
    setup();
    await tick();
    linkTreesStore.asyncSetLinkTrees.mockClear();

    linkTreesStore.setIsLinkTreeDeleted(false);
    linkTreesStore.setIsLinkTreeDelete(true);
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).not.toHaveBeenCalled();
    expect(linkTreesStore.isLinkTreeDelete).toBe(false);

    linkTreesStore.setIsLinkTreeDeleted(true);
    linkTreesStore.setIsLinkTreeDelete(true);
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeDeleted).toBe(false);
  });

  it("should reload after a successful delete-all and ignore a failed one", async () => {
    setup();
    await tick();
    linkTreesStore.asyncSetLinkTrees.mockClear();

    linkTreesStore.setIsLinkTreeDeletedAll(false);
    linkTreesStore.setIsLinkTreeDeleteAll(true);
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).not.toHaveBeenCalled();
    expect(linkTreesStore.isLinkTreeDeleteAll).toBe(false);

    linkTreesStore.setIsLinkTreeDeletedAll(true);
    linkTreesStore.setIsLinkTreeDeleteAll(true);
    await tick();
    expect(linkTreesStore.asyncSetLinkTrees).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeDeletedAll).toBe(false);
  });
});
