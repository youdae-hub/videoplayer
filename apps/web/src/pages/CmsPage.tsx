export function CmsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Content Management</h1>
      <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-8 text-center">
        <svg className="mx-auto h-12 w-12 text-neutral-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 17h10v-2H7v2zm0-4h10v-2H7v2zm0-4h10V7H7v2z" />
        </svg>
        <h2 className="mt-4 text-lg font-semibold text-neutral-300">Strapi CMS Integration</h2>
        <p className="mt-2 text-sm text-neutral-500">
          Video content management will be available after Strapi CMS integration in Phase 4.
        </p>
        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-neutral-500">
              <tr className="border-t border-neutral-800">
                <td className="px-4 py-3" colSpan={4}>
                  Connect Strapi to manage videos
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
