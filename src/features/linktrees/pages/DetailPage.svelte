<script>
  import { onMount } from "svelte";
  import { navigate } from "../../../router.js";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ItemModal from "../modals/ItemModal.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Trash2,
    Calendar,
    Globe,
    Lock,
    EyeOff,
    Link,
    ExternalLink,
    Plus,
    Pencil,
  } from "lucide-svelte";

  export let linkTreeId;

  const TYPE_META = {
    public: { label: "Publik", icon: Globe, class: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    unlisted: { label: "Tidak Terdaftar", icon: EyeOff, class: "bg-amber-50 text-amber-700 border-amber-200" },
    private: { label: "Privat", icon: Lock, class: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  $: profile = $usersStore.profile;
  $: linkTree = $linkTreesStore.linkTree;
  $: isOwner = Boolean(profile) && Boolean(linkTree) && linkTree.user_id === profile.id;

  let showCoverModal = false;
  let showEditModal = false;
  let showItemModal = false;
  let selectedItem = null;

  function load(id) {
    linkTreesStore.setLinkTree(null);
    linkTreesStore.asyncSetLinkTree(id);
  }

  onMount(() => {
    load(linkTreeId);
  });

  let prevId = linkTreeId;
  $: if (linkTreeId !== prevId) {
    prevId = linkTreeId;
    load(linkTreeId);
  }

  $: if ($linkTreesStore.isLinkTree) {
    linkTreesStore.setIsLinkTree(false);
    if (!linkTree) {
      navigate("/");
    }
  }

  $: if ($linkTreesStore.isLinkTreeDelete) {
    linkTreesStore.setIsLinkTreeDelete(false);
    if ($linkTreesStore.isLinkTreeDeleted) {
      linkTreesStore.setIsLinkTreeDeleted(false);
      navigate("/");
    }
  }

  $: if ($linkTreesStore.isItemDelete) {
    linkTreesStore.setIsItemDelete(false);
    if ($linkTreesStore.isItemDeleted) {
      linkTreesStore.setIsItemDeleted(false);
      linkTreesStore.asyncSetLinkTree(linkTree.id);
    }
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus link tree ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTree.id);
    }
  }

  function openAddItem() {
    selectedItem = null;
    showItemModal = true;
  }

  function openEditItem(item) {
    selectedItem = item;
    showItemModal = true;
  }

  async function handleDeleteItem(item) {
    const result = await showConfirmDialog(`Hapus tautan "${item.title}"?`);
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsItemDelete(linkTree.id, item.id);
    }
  }
</script>

{#if !profile || !linkTree}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  {@const items = linkTree.items || []}
  {@const meta = TYPE_META[linkTree.type]}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Back button & Action buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-link-trees-link"
        on:click|preventDefault={() => navigate("/")}
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Link Tree
      </a>

      {#if isOwner}
        <div class="flex items-center gap-2">
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        </div>
      {/if}
    </div>

    <!-- Main Detail Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="relative w-full h-56 sm:h-72 bg-gradient-to-br from-indigo-500 to-cyan-500 overflow-hidden">
        {#if linkTree.cover}
          <img src={linkTree.cover} alt={linkTree.title} class="w-full h-full object-cover" />
        {/if}
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent"></div>
      </div>

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border {meta.class}">
            <svelte:component this={meta.icon} size={14} />
            {meta.label}
          </span>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {linkTree.title}
          </h1>

          <div class="flex items-center gap-2 text-sm text-slate-500">
            {#if linkTree.author.photo}
              <img src={linkTree.author.photo} alt={linkTree.author.name} class="w-6 h-6 rounded-full object-cover border border-slate-200" />
            {/if}
            <span>Oleh <strong class="text-slate-700">{linkTree.author.name}</strong></span>
          </div>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Dibuat: <strong class="text-slate-500">{formatDate(linkTree.created_at)}</strong></span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Diperbarui: <strong class="text-slate-500">{formatDate(linkTree.updated_at)}</strong></span>
            </div>
          </div>
        </div>

        <p
          data-testid="link-tree-description"
          class="text-slate-600 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >{linkTree.description}</p>

        <!-- Items -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Link size={18} class="text-indigo-600" />
              Daftar Tautan
              <span data-testid="items-count" class="text-xs font-semibold text-slate-400">({items.length})</span>
            </h2>
            {#if isOwner}
              <button
                type="button"
                data-testid="add-item-btn"
                on:click={openAddItem}
                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
                Tambah Tautan
              </button>
            {/if}
          </div>

          {#if items.length === 0}
            <p data-testid="items-empty" class="text-sm italic text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-2xl">
              Belum ada tautan pada link tree ini.
            </p>
          {:else}
            <ul class="space-y-2.5">
              {#each items as item (item.id)}
                <li
                  data-testid={`item-row-${item.id}`}
                  class="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`item-link-${item.id}`}
                    class="flex-1 min-w-0 flex items-center gap-3"
                  >
                    <span class="w-9 h-9 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ExternalLink size={16} />
                    </span>
                    <span class="min-w-0">
                      <span class="block font-semibold text-slate-800 truncate">{item.title}</span>
                      <span class="block text-xs text-slate-400 truncate">{item.url}</span>
                    </span>
                  </a>
                  {#if isOwner}
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-item-${item.id}`}
                        on:click={() => openEditItem(item)}
                        class="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Ubah Tautan"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-item-${item.id}`}
                        on:click={() => handleDeleteItem(item)}
                        class="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Tautan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </div>

    <ChangeCoverModal
      show={showCoverModal}
      {linkTree}
      onClose={() => (showCoverModal = false)}
    />

    <ChangeModal
      show={showEditModal}
      {linkTree}
      onClose={() => (showEditModal = false)}
    />

    <ItemModal
      show={showItemModal}
      linkTreeId={linkTree.id}
      item={selectedItem}
      onClose={() => (showItemModal = false)}
    />
  </div>
{/if}
