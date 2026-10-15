<script>
  import { createEventDispatcher } from "svelte";
  import { PenLine, X, LoaderCircle } from "lucide-svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { showErrorDialog } from "../../../helpers/toolsHelper";

  export let show = false;
  export let linkTree = null;
  export let onClose = undefined;

  const dispatch = createEventDispatcher();

  let loading = false;
  let title = "";
  let type = "public";
  let description = "";
  let loadedId = null;

  function handleClose() {
    dispatch("close");
    if (onClose) onClose();
  }

  $: document.body.style.overflow = show ? "hidden" : "auto";

  // Isi form dengan data link tree setiap modal dibuka untuk data yang berbeda.
  $: if (show && linkTree && loadedId !== linkTree.id) {
    loadedId = linkTree.id;
    title = linkTree.title;
    type = linkTree.type;
    description = linkTree.description;
  }

  $: if ($linkTreesStore.isLinkTreeChange) {
    loading = false;
    linkTreesStore.setIsLinkTreeChange(false);
    if ($linkTreesStore.isLinkTreeChanged) {
      linkTreesStore.setIsLinkTreeChanged(false);
      linkTreesStore.asyncSetLinkTrees();
      linkTreesStore.asyncSetLinkTree(linkTree.id);
      loadedId = null;
      handleClose();
    }
  }

  function handleSave() {
    if (!title.trim()) {
      showErrorDialog("Judul tidak boleh kosong");
      return;
    }

    if (!description.trim()) {
      showErrorDialog("Deskripsi tidak boleh kosong");
      return;
    }

    loading = true;
    linkTreesStore.asyncSetIsLinkTreeChange(
      linkTree.id,
      title.trim(),
      type,
      description.trim()
    );
  }
</script>

{#if show && linkTree}
  <div
    data-testid="edit-link-tree-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
  >
    <div class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
            <PenLine size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-800">Ubah Data Link Tree</h3>
            <p class="text-xs text-slate-500">Perbarui judul, jenis akses, dan deskripsi</p>
          </div>
        </div>
        <button
          type="button"
          data-testid="close-edit-modal-btn"
          on:click={handleClose}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      <form on:submit|preventDefault={handleSave} class="p-6 space-y-4">
        <div>
          <label for="edit-link-tree-title-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Judul <span class="text-red-500">*</span>
          </label>
          <input
            id="edit-link-tree-title-input"
            type="text"
            data-testid="edit-link-tree-title-input"
            bind:value={title}
            placeholder="Contoh: Sumber Belajar Pemrograman Web"
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          />
        </div>

        <div>
          <label for="edit-link-tree-type-select" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Jenis Akses
          </label>
          <select
            id="edit-link-tree-type-select"
            data-testid="edit-link-tree-type-select"
            bind:value={type}
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs"
          >
            <option value="public">Publik - dapat dilihat semua orang</option>
            <option value="unlisted">Tidak terdaftar - hanya lewat tautan</option>
            <option value="private">Privat - hanya saya</option>
          </select>
        </div>

        <div>
          <label for="edit-link-tree-description-input" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Deskripsi <span class="text-red-500">*</span>
          </label>
          <textarea
            id="edit-link-tree-description-input"
            data-testid="edit-link-tree-description-input"
            bind:value={description}
            rows="4"
            placeholder="Ceritakan singkat isi kumpulan tautan ini..."
            class="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-sm shadow-xs resize-y"
          ></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            data-testid="cancel-edit-modal-btn"
            on:click={handleClose}
            disabled={loading}
            class="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            data-testid="submit-edit-modal-btn"
            disabled={loading}
            class="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md shadow-amber-600/25 transition-all disabled:opacity-60"
          >
            {#if loading}
              <LoaderCircle size={18} class="animate-spin" />
              <span>Menyimpan...</span>
            {:else}
              <PenLine size={18} strokeWidth={2.5} />
              <span>Perbarui</span>
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
