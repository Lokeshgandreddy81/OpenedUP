import React, { useMemo, useState } from "react";
import { Search, Check, Plus, Trash2 } from "lucide-react";
import { CHAT_PLUGINS, setPluginInstalled, useInstalledPluginIds } from "../state/pluginStore";

export type PluginCategory = "All" | "Featured" | "Installed";
export type PluginSubTab = "Yours" | "Discover";

export const PluginsScreen: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<PluginCategory>("All");
  const [subTab, setSubTab] = useState<PluginSubTab>("Discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");
  const installedIds = useInstalledPluginIds();

  const visiblePlugins = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return CHAT_PLUGINS.filter((plugin) => {
      const installed = installedIds.includes(plugin.id);
      if (subTab === "Yours" && !installed) return false;
      if (activeCategory === "Featured" && !plugin.featured) return false;
      if (activeCategory === "Installed" && !installed) return false;
      return (
        !query ||
        `${plugin.name} ${plugin.description} ${plugin.category}`.toLowerCase().includes(query)
      );
    });
  }, [activeCategory, installedIds, searchQuery, subTab]);

  return (
    <div className="flex-1 w-full h-full bg-white flex flex-col font-sans overflow-y-auto">
      <div className="w-full px-6 sm:px-8 md:px-10 lg:px-12 pt-7 md:pt-8 pb-8 flex flex-col">
        <h1 className="text-[28px] md:text-[30px] font-serif text-neutral-900 font-normal tracking-tight">
          Plugins
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500">
          Install built-in chat capabilities. Each one lists the context it can read; plugins cannot
          run third-party code or access external services.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              {(["All", "Featured", "Installed"] as PluginCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={activeCategory === category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-lg px-3 py-1 text-[13px] ${activeCategory === category ? "bg-[#ECECF1] font-medium text-neutral-900" : "text-neutral-500 hover:text-neutral-800"}`}
                >
                  {category}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="inline-flex rounded-lg bg-[#F1F1F4] p-0.5">
              {(["Yours", "Discover"] as PluginSubTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={subTab === tab}
                  onClick={() => setSubTab(tab)}
                  className={`rounded-md px-3 py-1 text-xs ${subTab === tab ? "bg-white font-medium text-neutral-900 shadow-xs" : "text-neutral-500"}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <label className="relative flex items-center">
            <Search size={14} className="pointer-events-none absolute left-2.5 text-neutral-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search plugins"
              aria-label="Search plugins"
              className="h-8 w-52 rounded-lg border border-neutral-200 pl-8 pr-3 text-[13px] outline-none focus:border-neutral-400 sm:w-60"
            />
          </label>
        </div>

        {notice && (
          <p role="status" className="mt-4 text-sm text-emerald-700">
            {notice}
          </p>
        )}
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visiblePlugins.map((plugin) => {
            const installed = installedIds.includes(plugin.id);
            return (
              <article
                key={plugin.id}
                className="flex flex-col gap-4 rounded-2xl border border-neutral-200 p-5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-neutral-900">{plugin.name}</h2>
                      <p className="mt-1 text-xs text-neutral-500">
                        {plugin.category}
                        {plugin.featured ? " · Featured" : ""}
                      </p>
                    </div>
                    {installed && (
                      <Check size={16} aria-label="Installed" className="text-emerald-600" />
                    )}
                  </div>
                  <p className="mt-3 text-sm leading-5 text-neutral-600">{plugin.description}</p>
                </div>

                <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                    Permissions
                  </p>
                  <ul className="mt-1 list-disc pl-4 text-xs leading-5 text-neutral-600">
                    {plugin.permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  aria-label={`${installed ? "Remove" : "Install"} ${plugin.name}`}
                  onClick={() => {
                    setPluginInstalled(plugin.id, !installed);
                    setNotice(
                      installed
                        ? `${plugin.name} removed.`
                        : `${plugin.name} installed and available in chat skills.`
                    );
                  }}
                  className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ${installed ? "border border-neutral-200 text-neutral-700 hover:bg-neutral-50" : "bg-neutral-950 text-white hover:bg-neutral-800"}`}
                >
                  {installed ? <Trash2 size={14} /> : <Plus size={14} />}
                  {installed ? "Remove" : "Install"}
                </button>
              </article>
            );
          })}
        </div>
        {visiblePlugins.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 px-5 py-10 text-center">
            <p className="text-sm font-medium text-neutral-800">No plugins found</p>
            <p className="mt-1 text-sm text-neutral-500">
              Try another search or discover an available capability.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginsScreen;
