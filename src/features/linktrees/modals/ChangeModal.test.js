import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

const mockLinkTree = {
  id: 7,
  title: "Judul Awal",
  type: "private",
  description: "Deskripsi Awal",
};

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false or link tree is missing", () => {
    const hidden = renderWithProviders(ChangeModal, {
      props: { show: false, linkTree: mockLinkTree },
    });
    expect(hidden.wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
    hidden.unmount();

    const empty = renderWithProviders(ChangeModal, { props: { show: true, linkTree: null } });
    expect(empty.wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
  });

  it("should prefill the form with the link tree data", async () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree },
    });
    await tick();

    expect(document.body.style.overflow).toBe("hidden");
    expect(wrapper.text()).toContain("Ubah Data Link Tree");
    expect(wrapper.find('[data-testid="edit-link-tree-title-input"]').element.value).toBe("Judul Awal");
    expect(wrapper.find('[data-testid="edit-link-tree-type-select"]').element.value).toBe("private");
    expect(wrapper.find('[data-testid="edit-link-tree-description-input"]').element.value).toBe(
      "Deskripsi Awal"
    );
  });

  it("should validate empty title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree },
    });
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="edit-link-tree-title-input"]').setValue("   ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="edit-link-tree-title-input"]').setValue("Judul");
    await wrapper.find('[data-testid="edit-link-tree-description-input"]').setValue("   ");
    await wrapper.find("form").trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");

    expect(changeSpy).not.toHaveBeenCalled();
  });

  it("should submit changes and refresh data after success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockResolvedValue();
    const listSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockResolvedValue();
    const detailSpy = vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="edit-link-tree-title-input"]').setValue("  Baru  ");
    await wrapper.find('[data-testid="edit-link-tree-type-select"]').setValue("public");
    await wrapper.find("form").trigger("submit");
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(7, "Baru", "public", "Deskripsi Awal");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeChanged(true);
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();

    expect(listSpy).toHaveBeenCalled();
    expect(detailSpy).toHaveBeenCalledWith(7);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(linkTreesStore.isLinkTreeChange).toBe(false);
    expect(linkTreesStore.isLinkTreeChanged).toBe(false);
  });

  it("should stay open when the change fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree, onClose: closeSpy },
    });
    vi.spyOn(linkTreesStore, "asyncSetIsLinkTreeChange").mockResolvedValue();
    await tick();

    await wrapper.find("form").trigger("submit");
    await tick();

    linkTreesStore.setIsLinkTreeChanged(false);
    linkTreesStore.setIsLinkTreeChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.find('[data-testid="submit-edit-modal-btn"]').element.disabled).toBe(false);
  });

  it("should close from close and cancel buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const withCb = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree, onClose: closeSpy },
    });
    await withCb.wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    await withCb.wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
    withCb.unmount();

    const withoutCb = renderWithProviders(ChangeModal, {
      props: { show: true, linkTree: mockLinkTree },
    });
    await withoutCb.wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(withoutCb.wrapper.exists()).toBe(true);
  });
});
