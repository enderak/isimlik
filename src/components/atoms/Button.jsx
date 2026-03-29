export const Button = ({ onClick, children, variant = "primary" }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md active:scale-95 
    ${variant === "primary" ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30" : "bg-white text-slate-600 hover:bg-slate-50"}`}
  >
    {children}
  </button>
);