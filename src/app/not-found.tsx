import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-24 text-center">
      <div className="max-w-md">
        <LogoMark className="mx-auto h-16 text-coral/40" />
        <p className="mt-8 font-serif text-7xl text-charcoal">404</p>
        <h1 className="mt-2 font-serif text-3xl">This page has wandered off</h1>
        <p className="mt-3 text-graphite">
          The page you&apos;re looking for doesn&apos;t exist — but there&apos;s plenty
          more to discover.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="primary" size="lg">Back to home</ButtonLink>
          <ButtonLink href="/shop" variant="outline" size="lg">Browse the shop</ButtonLink>
        </div>
      </div>
    </div>
  );
}
