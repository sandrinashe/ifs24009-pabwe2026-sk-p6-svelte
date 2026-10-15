import { describe, it, expect, vi, beforeEach } from "vitest";
import LinkTreeLayout from "./LinkTreeLayout.svelte";
import { renderWithProviders } from "../../../test-utils";
import apiHelper from "../../../helpers/apiHelper";
import { usersStore } from "../../users/states/usersStore";
import * as routerModule from "../../../router";

describe("LinkTreeLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(() => Promise.resolve());
  });

  it("should redirect to login if access token does not exist", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(null);
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: null },
    });

    expect(navSpy).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.asyncSetProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });

  it("should load the profile when an access token exists", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");

    renderWithProviders(LinkTreeLayout, { preloadedState: { profile: null } });

    expect(usersStore.asyncSetProfile).toHaveBeenCalled();
  });

  it("should render navbar and sidebar, toggle the sidebar and log out", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { wrapper, authStore } = renderWithProviders(LinkTreeLayout, {
      preloadedState: {
        profile: { id: 1, name: "Test User", email: "test@delcom.org" },
      },
    });

    expect(wrapper.text()).toContain("Delcom Link Tree");
    expect(wrapper.text()).toContain("Test User");
    expect(wrapper.text()).toContain("Semua Link Tree");

    // Buka sidebar mobile lalu tutup lewat backdrop
    await wrapper.find('[data-testid="toggle-sidebar-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    const backdrop = wrapper.find('[data-testid="sidebar-backdrop"]');
    expect(backdrop.exists()).toBe(true);
    await backdrop.trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);

    // Logout dari dropdown profil
    const logoutSpy = vi
      .spyOn(authStore, "asyncSetIsAuthLogout")
      .mockImplementation(() => {});
    await wrapper.find('[data-testid="profile-dropdown-button"]').trigger("click");
    await wrapper.find('[data-testid="dropdown-logout-button"]').trigger("click");

    expect(logoutSpy).toHaveBeenCalled();
  });

  it("should stay on page when isProfile is triggered and profile exists", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});

    const { wrapper, usersStore: users } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isProfile: false },
    });

    users.setIsProfile(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(putTokenSpy).not.toHaveBeenCalled();
    expect(users.isProfile).toBe(false);
    expect(wrapper.text()).toContain("Logged User");
  });

  it("should redirect to login when isProfile is triggered and profile is null", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { usersStore: users } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: null, isProfile: false },
    });

    users.setIsProfile(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(putTokenSpy).toHaveBeenCalledWith("");
    expect(navSpy).toHaveBeenCalledWith("/auth/login");
  });

  it("should redirect to login when isAuthLogout is true", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { authStore } = renderWithProviders(LinkTreeLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isAuthLogout: false },
    });

    authStore.setIsAuthLogout(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(navSpy).toHaveBeenCalledWith("/auth/login");
    expect(authStore.isAuthLogout).toBe(false);
  });
});
