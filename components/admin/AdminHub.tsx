'use client'



import Link from 'next/link'



/**

 * Signed-in admin landing: choose gallery, homepage, or quotes.

 */

export default function AdminHub() {

  return (

    <div className="px-4 py-12 sm:px-6">

      <div className="mx-auto max-w-xl">

        <h1 className="text-center font-serif text-3xl font-semibold home-text">Admin</h1>

        <p className="mt-2 text-center text-sm home-text-muted">

          Choose a page to edit. Header, Footer and colors are on Home Admin.

        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">

          <Link

            href="/admin/gallery"

            className="rounded-2xl border home-border home-bg-2 p-6 text-center shadow-sm hover:shadow-md"

          >

            <h2 className="text-lg font-semibold home-text">Studio</h2>

            <p className="mt-2 text-sm home-text-muted">Gallery photos and studio copy</p>

          </Link>

          <Link

            href="/admin/home"

            className="rounded-2xl border home-border home-bg-2 p-6 text-center shadow-sm hover:shadow-md"

          >

            <h2 className="text-lg font-semibold home-text">Home</h2>

            <p className="mt-2 text-sm home-text-muted">Homepage copy, photos, layout, and About</p>

          </Link>

          <Link

            href="/admin/quotes"

            className="rounded-2xl border home-border home-bg-2 p-6 text-center shadow-sm hover:shadow-md"

          >

            <h2 className="text-lg font-semibold home-text">Quote requests</h2>

            <p className="mt-2 text-sm home-text-muted">Review requests and update status</p>

          </Link>

          <Link

            href="/admin/quotes/form"

            className="rounded-2xl border home-border home-bg-2 p-6 text-center shadow-sm hover:shadow-md"

          >

            <h2 className="text-lg font-semibold home-text">Quote form</h2>

            <p className="mt-2 text-sm home-text-muted">Show, hide, and require questions</p>

          </Link>

        </div>

      </div>

    </div>

  )

}

