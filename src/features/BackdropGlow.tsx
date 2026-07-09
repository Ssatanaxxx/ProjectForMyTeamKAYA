export const BackdropGlow = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -left-40 -top-40 h-[440px] w-[440px] rounded-full bg-brand/20 blur-[120px]" />
    <div className="absolute -right-40 top-20 h-[380px] w-[380px] rounded-full bg-brand/10 blur-[120px]" />
  </div>
);