import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false and unlock body scroll", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render the form and lock body scroll when show is true", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(true);
    expect(wrapper.text()).toContain("Tambah Link Tree Baru");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should validate empty title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, { props: { show: true } });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockResolvedValue();

    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="add-link-tree-title-input"]').setValue("Judul");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should submit trimmed values with the selected type and reset after success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockResolvedValue();
    const listSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockResolvedValue();

    await wrapper.find('[data-testid="add-link-tree-title-input"]').setValue("  Judul  ");
    await wrapper.find('[data-testid="add-link-tree-type-select"]').setValue("unlisted");
    await wrapper.find('[data-testid="add-link-tree-description-input"]').setValue("  Isi  ");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(addSpy).toHaveBeenCalledWith("Judul", "unlisted", "Isi");
    expect(wrapper.find('[data-testid="submit-add-modal-btn"]').element.disabled).toBe(true);
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeAdded(true);
    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();

    expect(listSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeAdd).toBe(false);
    expect(linkTreesStore.isLinkTreeAdded).toBe(false);
    expect(wrapper.find('[data-testid="add-link-tree-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="add-link-tree-type-select"]').element.value).toBe("public");
    expect(wrapper.find('[data-testid="add-link-tree-description-input"]').element.value).toBe("");
  });

  it("should stay open and stop loading when adding fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd").mockResolvedValue();

    await wrapper.find('[data-testid="add-link-tree-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="add-link-tree-description-input"]').setValue("Isi");
    await wrapper.find("form").trigger("submit");
    await tick();

    linkTreesStore.setIsLinkTreeAdded(false);
    linkTreesStore.setIsLinkTreeAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="submit-add-modal-btn"]').element.disabled).toBe(false);
    expect(wrapper.text()).toContain("Tambah Link Tree");
  });

  it("should close from close and cancel buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const withCb = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    await withCb.wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    await withCb.wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    withCb.unmount();

    const withoutCb = renderWithProviders(AddModal, { props: { show: true } });
    await withoutCb.wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(withoutCb.wrapper.exists()).toBe(true);
  });
});
