import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemModal from "./ItemModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

const mockItem = { id: 5, link_tree_id: 2, title: "Svelte", url: "https://svelte.dev" };

describe("ItemModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: false, linkTreeId: 2 },
    });
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render an empty add form", async () => {
    const { wrapper } = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 2 } });
    await tick();

    expect(document.body.style.overflow).toBe("hidden");
    expect(wrapper.text()).toContain("Tambah Tautan");
    expect(wrapper.text()).toContain("Simpan Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("");
  });

  it("should render a prefilled edit form", async () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, item: mockItem },
    });
    await tick();

    expect(wrapper.text()).toContain("Ubah Tautan");
    expect(wrapper.text()).toContain("Perbarui Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Svelte");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("https://svelte.dev");
  });

  it("should validate title and url", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2 },
    });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();
    await tick();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tautan tidak boleh kosong");

    await wrapper.find('[data-testid="item-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="item-url-input"]').setValue("bukan-url");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("URL tidak valid. Gunakan format https://contoh.com");

    await wrapper.find('[data-testid="item-url-input"]').setValue("ftp://contoh.com");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledTimes(3);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should add an item and refresh the detail after success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="item-title-input"]').setValue(" Svelte ");
    await wrapper.find('[data-testid="item-url-input"]').setValue(" https://svelte.dev ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith(2, "Svelte", "https://svelte.dev");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsItemAdded(true);
    linkTreesStore.setIsItemAdd(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(2);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isItemAdd).toBe(false);
    expect(linkTreesStore.isItemAdded).toBe(false);
  });

  it("should stay open when adding fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsItemAdd").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="item-title-input"]').setValue("Svelte");
    await wrapper.find('[data-testid="item-url-input"]').setValue("https://svelte.dev");
    await wrapper.find("form").trigger("submit");
    await tick();

    linkTreesStore.setIsItemAdded(false);
    linkTreesStore.setIsItemAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="submit-item-modal-btn"]').element.disabled).toBe(false);
  });

  it("should update an item and refresh the detail after success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, item: mockItem, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsItemChange").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="item-title-input"]').setValue("Svelte 5");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(2, 5, "Svelte 5", "https://svelte.dev");

    linkTreesStore.setIsItemChanged(true);
    linkTreesStore.setIsItemChange(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(2);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isItemChange).toBe(false);
    expect(linkTreesStore.isItemChanged).toBe(false);
  });

  it("should stay open when updating fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, item: mockItem, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsItemChange").mockResolvedValue();
    await tick();

    await wrapper.find("form").trigger("submit");
    await tick();

    linkTreesStore.setIsItemChanged(false);
    linkTreesStore.setIsItemChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="submit-item-modal-btn"]').element.disabled).toBe(false);
  });

  it("should re-sync the form after the modal is closed and reopened", async () => {
    const { wrapper, rerender } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, item: mockItem },
    });
    await tick();
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Svelte");

    await rerender({ show: false });
    await tick();
    await rerender({ show: true, item: null });
    await tick();

    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
  });

  it("should close from close and cancel buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const withCb = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 2, onClose: closeSpy },
    });
    await withCb.wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    await withCb.wrapper.find('[data-testid="cancel-item-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    withCb.unmount();

    const withoutCb = renderWithProviders(ItemModal, { props: { show: true, linkTreeId: 2 } });
    await withoutCb.wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(withoutCb.wrapper.exists()).toBe(true);
  });
});
