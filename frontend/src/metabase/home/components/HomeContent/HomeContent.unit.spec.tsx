import {
  setupDatabaseCandidatesEndpoint,
  setupDatabasesEndpoints,
  setupPopularItemsEndpoints,
  setupRecentViewsEndpoints,
} from "__support__/server-mocks";
import {
  renderWithProviders,
  screen,
  waitForLoaderToBeRemoved,
} from "__support__/ui";
import type {
  Database,
  PopularItem,
  RecentItem,
  User,
} from "metabase-types/api";
import {
  createMockDatabase,
  createMockPopularItem,
  createMockRecentItem,
  createMockUser,
} from "metabase-types/api/mocks";
import {
  createMockSettingsState,
  createMockState,
} from "metabase-types/store/mocks";

import { HomeContent } from "./HomeContent";

interface SetupOpts {
  user: User;
  databases?: Database[];
  recentItems?: RecentItem[];
  popularItems?: PopularItem[];
  isXrayEnabled?: boolean;
  hasEmbeddingHomepageFlag?: boolean;
}

const setup = async ({
  user,
  databases = [],
  recentItems = [],
  popularItems = [],
  isXrayEnabled = true,
  hasEmbeddingHomepageFlag = false,
}: SetupOpts) => {
  const state = createMockState({
    currentUser: user,
    settings: createMockSettingsState({
      "enable-xrays": isXrayEnabled,
    }),
  });

  if (hasEmbeddingHomepageFlag) {
    localStorage.setItem("showEmbedHomepage", "true");
  }

  setupDatabasesEndpoints(databases);
  setupRecentViewsEndpoints(recentItems);
  setupPopularItemsEndpoints(popularItems);
  databases.forEach(({ id }) => setupDatabaseCandidatesEndpoint(id, []));

  renderWithProviders(<HomeContent />, { storeInitialState: state });

  await waitForLoaderToBeRemoved();
};

describe("HomeContent", () => {
  beforeEach(() => {
    jest.useFakeTimers({
      advanceTimers: true,
      now: new Date(2020, 0, 10),
      doNotFake: ["setTimeout"],
    });
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should render popular items for a new user", async () => {
    await setup({
      user: createMockUser({
        is_installer: false,
        has_question_and_dashboard: true,
        first_login: "2020-01-05T00:00:00Z",
      }),
      databases: [createMockDatabase()],
      recentItems: [createMockRecentItem()],
      popularItems: [createMockPopularItem()],
    });

    expect(
      await screen.findByText("Here are some popular tables"),
    ).toBeInTheDocument();
  });

  it("should render popular items for a user without recent items", async () => {
    await setup({
      user: createMockUser({
        is_installer: false,
        has_question_and_dashboard: true,
        first_login: "2020-01-05T00:00:00Z",
      }),
      databases: [createMockDatabase()],
      popularItems: [createMockPopularItem()],
    });

    expect(
      screen.getByText("Here are some popular tables"),
    ).toBeInTheDocument();
  });

  it("should render recent items for an existing user", async () => {
    await setup({
      user: createMockUser({
        is_installer: false,
        has_question_and_dashboard: true,
        first_login: "2020-01-01T00:00:00Z",
      }),
      databases: [createMockDatabase()],
      recentItems: [createMockRecentItem()],
    });

    expect(screen.getByText("Pick up where you left off")).toBeInTheDocument();
  });

  it("should render x-rays for an installer after the setup", async () => {
    await setup({
      user: createMockUser({
        is_installer: true,
        has_question_and_dashboard: false,
        first_login: "2020-01-10T00:00:00Z",
      }),
      databases: [createMockDatabase()],
    });

    expect(screen.getByText(/Here are some explorations/)).toBeInTheDocument();
  });

  it("should render x-rays for the installer when there is no question and dashboard", async () => {
    await setup({
      user: createMockUser({
        is_installer: true,
        has_question_and_dashboard: false,
        first_login: "2020-01-10T00:00:00Z",
      }),
      databases: [createMockDatabase()],
      recentItems: [createMockRecentItem()],
    });

    expect(screen.getByText(/Here are some explorations/)).toBeInTheDocument();
  });

  it("should not render x-rays for the installer when there is no question and dashboard if the x-rays feature is disabled", async () => {
    await setup({
      user: createMockUser({
        is_installer: true,
        has_question_and_dashboard: false,
        first_login: "2020-01-10T00:00:00Z",
      }),
      databases: [createMockDatabase()],
      recentItems: [createMockRecentItem()],
      isXrayEnabled: false,
    });

    expect(
      screen.queryByText(/Here are some explorations/),
    ).not.toBeInTheDocument();
  });

  it("should render nothing if there are no databases", async () => {
    await setup({
      user: createMockUser({
        is_installer: true,
        has_question_and_dashboard: false,
        first_login: "2020-01-10T00:00:00Z",
      }),
    });

    expect(
      screen.queryByText(/Here are some explorations/),
    ).not.toBeInTheDocument();
  });

  describe("embed-focused homepage", () => {
    it("should show it for admins if the localStorage flag is set", async () => {
      await setup({
        user: createMockUser({ is_superuser: true }),
        hasEmbeddingHomepageFlag: true,
        databases: [createMockDatabase()],
      });

      expect(
        screen.getByText("Embed Metabase in your app"),
      ).toBeInTheDocument();
    });

    it("should not show it for non-admins even if the flag is set", async () => {
      await setup({
        user: createMockUser({ is_superuser: false }),
        hasEmbeddingHomepageFlag: true,
        databases: [createMockDatabase()],
      });

      expect(
        screen.queryByText("Embed Metabase in your app"),
      ).not.toBeInTheDocument();
    });

    it("should be possible to dismiss it", async () => {
      await setup({
        user: createMockUser({ is_superuser: true }),
        hasEmbeddingHomepageFlag: true,
        databases: [createMockDatabase()],
      });

      screen.getByRole("button", { name: "close icon" }).click();

      expect(
        screen.queryByText("Embed Metabase in your app"),
      ).not.toBeInTheDocument();

      expect(localStorage.getItem("showEmbedHomepage")).toBeNull();
    });

    it("should not show it if the user is not admin", async () => {
      await setup({
        user: createMockUser({ is_superuser: false }),
        hasEmbeddingHomepageFlag: true,
        databases: [createMockDatabase()],
      });

      expect(
        screen.queryByText("Embed Metabase in your app"),
      ).not.toBeInTheDocument();
    });

    it("should not show it if the localStorage flag is not set", async () => {
      await setup({
        user: createMockUser({ is_superuser: true }),
        databases: [createMockDatabase()],
      });

      expect(
        screen.queryByText("Embed Metabase in your app"),
      ).not.toBeInTheDocument();
    });
  });
});
