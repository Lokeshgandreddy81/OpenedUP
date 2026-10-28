import React from "react";
import { docApiEndpoints, docEnvVars } from "../../data/docsContent";

const coreEndpoints = [docApiEndpoints[0], docApiEndpoints[3], docApiEndpoints[4]];
const coreEnvVars = [docEnvVars[0], docEnvVars[3], docEnvVars[4]];

export const DocsReference: React.FC = () => {
  return (
    <section id="reference" className="scroll-mt-28 border-t border-neutral-200/80 py-9">
      <h2 className="text-[23px] font-semibold leading-tight tracking-[-0.025em] text-neutral-950">
        API reference
      </h2>

      <div id="api-endpoints" className="mt-5 scroll-mt-28">
        <h3 className="text-[14px] font-medium text-neutral-800">Endpoints</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-neutral-200/70">
              {coreEndpoints.map((endpoint) => (
                <tr key={`${endpoint.method}-${endpoint.path}`}>
                  <td className="whitespace-nowrap py-2.5 pr-5 font-mono text-[12px] font-medium text-neutral-950">
                    {endpoint.method} {endpoint.path}
                  </td>
                  <td className="py-2.5 text-neutral-600">{endpoint.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="env-vars" className="mt-6 scroll-mt-28">
        <h3 className="text-[14px] font-medium text-neutral-800">Environment</h3>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <tbody className="divide-y divide-neutral-200/70">
              {coreEnvVars.map((env) => (
                <tr key={env.name}>
                  <td className="whitespace-nowrap py-2.5 pr-5 font-mono text-[12px] font-medium text-neutral-950">
                    {env.name}
                  </td>
                  <td className="py-2.5 text-neutral-500">Default: {env.defaultValue || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
