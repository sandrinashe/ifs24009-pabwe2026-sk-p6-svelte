<script>
  import { onMount } from "svelte";
  import { navigate } from "../../../router.js";
  import AddModal from "../modals/AddModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    Plus,
    Link,
    Globe,
    Lock,
    EyeOff,
    Layers,
    Eye,
    Pencil,
    Trash2,
    Funnel,
    Search,
    LoaderCircle,
  } from "lucide-svelte";

  const TYPE_META = {
    public: { label: "Publik", icon: Globe, class: "bg-emerald-50 text-emerald-700 border-emerald-200/60" },
    unlisted: { label: "Tidak Terdaftar", icon: EyeOff, class: "bg-amber-50 text-amber-700 border-amber-200/60" },
    private: { label: "Privat", icon: Lock, class: "bg-slate-100 text-slate-700 border-slate-200" },
  };

  let loading = false;
  let filter = "";
  let searchQuery = "";
  let showAddModal = false;
  let showChangeModal = false;
  let selectedLinkTree = null;

  $: profile = $usersStore.profile;
  $: linkTrees = $linkTreesStore.linkTrees || [];

  onMount(() => {
    loadLinkTrees();
  });

  function loadLinkTrees() {
    loading = true;
    Promise.resolve(linkTreesStore.asyncSetLinkTrees(filter === "mine")).finally(() => {
      loading = false;
    });
  }

  let prevFilter = filter;
  $: if (filter !== prevFilter) {
    prevFilter = filter;
    loadLinkTrees();
  }

  $: if ($linkTreesStore.isLinkTreeDelete) {
    linkTreesStore.setIsLinkTreeDelete(false);
    if ($linkTreesStore.isLinkTreeDeleted) {
      linkTreesStore.setIsLinkTreeDeleted(false);
      loadLinkTrees();
    }
  }

  $: if ($linkTreesStore.isLinkTreeDeleteAll) {
    linkTreesStore.setIsLinkTreeDeleteAll(false);
    if ($linkTreesStore.isLinkTreeDeletedAll) {
      linkTreesStore.setIsLinkTreeDeletedAll(false);
      loadLinkTrees();
    }
  }

  function isOwner(linkTree) {
    return Boolean(profile) && linkTree.user_id === profile.id;
  }

  function handleEdit(linkTree) {
    selectedLinkTree = linkTree;
    showChangeModal = true;
  }

  async function handleDelete(linkTree) {
    const result = await showConfirmDialog(
      `Apakah Anda yakin ingin menghapus link tree "${linkTree.title}"?`
    );
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTree.id);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Semua link tree milik Anda beserta tautannya akan dihapus permanen. Lanjutkan?"
    );
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeDeleteAll();
    }
  }

  $: filteredLinkTrees = linkTrees.filter((linkTree) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      linkTree.title.toLowerCase().includes(q) ||
      linkTree.description.toLowerCase().includes(q)
    );
  });

  $: totalCount = linkTrees.length;
  $: mineCount = linkTrees.filter((l) => isOwner(l)).length;
  $: totalLinks = linkTrees.reduce((sum, l) => sum + l.total_links, 0);
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Header Banner -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Semua Link Tree
        </h1>
        <p class="text-sm text-slate-500 mt-1">
          Temukan dan kelola kumpulan tautan favorit dari komunitas Delcom.
        </p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        {#if mineCount > 0}
          <button
            type="button"
            data-testid="delete-all-btn"
            on:click={handleDeleteAll}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
          >
            <Trash2 size={18} />
            <span>Hapus Semua Milik Saya</span>
          </button>
        {/if}
        <button
          type="button"
          data-testid="add-link-tree-btn"
          on:click={() => (showAddModal = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Link Tree</span>
        </button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Link Tree</p>
          <h3 data-testid="stat-total" class="text-3xl font-black text-slate-800 mt-1">{totalCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <Layers size={26} strokeWidth={2} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Milik Saya</p>
          <h3 data-testid="stat-mine" class="text-3xl font-black text-emerald-600 mt-1">{mineCount}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Globe size={26} strokeWidth={2} />
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tautan</p>
          <h3 data-testid="stat-links" class="text-3xl font-black text-amber-600 mt-1">{totalLinks}</h3>
        </div>
        <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Link size={26} strokeWidth={2} />
        </div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="relative flex-1 max-w-md">
          <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            data-testid="search-link-tree-input"
            bind:value={searchQuery}
            placeholder="Cari judul atau deskripsi link tree..."
            class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
          />
        </div>

        <div class="flex items-center gap-2.5">
          <span class="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <Funnel size={16} /> Filter:
          </span>
          <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
              data-testid="filter-all-btn"
              on:click={() => (filter = "")}
              class="px-3 py-1.5 rounded-lg transition-all {filter === '' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
            >
              Semua
            </button>
            <button
              type="button"
              data-testid="filter-mine-btn"
              on:click={() => (filter = "mine")}
              class="px-3 py-1.5 rounded-lg transition-all {filter === 'mine' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
            >
              Milik Saya
            </button>
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="p-4 sm:p-5">
        {#if loading && filteredLinkTrees.length === 0}
          <div class="px-6 py-12 text-center text-slate-400">
            <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
            <p class="font-medium text-slate-600">Memuat daftar link tree...</p>
          </div>
        {:else if filteredLinkTrees.length === 0}
          <div class="px-6 py-12 text-center text-slate-400">
            <Link size={40} class="mx-auto text-slate-300 mb-2" />
            <p class="font-medium">Belum ada link tree yang cocok.</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {#each filteredLinkTrees as linkTree (linkTree.id)}
              {@const meta = TYPE_META[linkTree.type]}
              <article
                data-testid={`link-tree-card-${linkTree.id}`}
                class="group flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:shadow-slate-200/60 transition-all"
              >
                <div class="h-32 bg-gradient-to-br from-indigo-500 to-cyan-500 relative overflow-hidden">
                  {#if linkTree.cover}
                    <img src={linkTree.cover} alt={linkTree.title} class="w-full h-full object-cover" />
                  {/if}
                  <span class="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border {meta.class}">
                    <svelte:component this={meta.icon} size={12} />
                    {meta.label}
                  </span>
                </div>

                <div class="flex-1 p-5 space-y-2">
                  <h3 class="font-bold text-slate-800 leading-snug line-clamp-1">{linkTree.title}</h3>
                  <p class="text-sm text-slate-500 line-clamp-2">{linkTree.description}</p>
                  <div class="flex items-center gap-2 pt-1 text-xs text-slate-400">
                    <span class="font-semibold text-slate-500">{linkTree.author.name}</span>
                    <span>&middot;</span>
                    <span>{linkTree.total_links} tautan</span>
                    <span>&middot;</span>
                    <span>{formatDate(linkTree.updated_at)}</span>
                  </div>
                </div>

                <div class="flex items-center justify-end gap-1.5 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
                  <button
                    type="button"
                    data-testid={`view-link-tree-${linkTree.id}`}
                    on:click={() => navigate(`/link-trees/${linkTree.id}`)}
                    class="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Lihat Detail"
                  >
                    <Eye size={18} />
                  </button>
                  {#if isOwner(linkTree)}
                    <button
                      type="button"
                      data-testid={`edit-link-tree-${linkTree.id}`}
                      on:click={() => handleEdit(linkTree)}
                      class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Ubah Link Tree"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      type="button"
                      data-testid={`delete-link-tree-${linkTree.id}`}
                      on:click={() => handleDelete(linkTree)}
                      class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Link Tree"
                    >
                      <Trash2 size={18} />
                    </button>
                  {/if}
                </div>
              </article>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Modals -->
    <AddModal show={showAddModal} on:close={() => (showAddModal = false)} />
    <ChangeModal
      show={showChangeModal}
      linkTree={selectedLinkTree}
      on:close={() => (showChangeModal = false)}
    />
  </div>
{/if}
