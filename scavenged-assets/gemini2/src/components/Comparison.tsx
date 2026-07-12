export const Comparison = () => {
  return (
    <section className="bg-white py-20 px-6 font-sans border-t-8 border-black">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-black text-4xl font-black uppercase mb-12 text-center tracking-tighter">
          The 6-Inch Structural Standard <span className="text-gray-200">vs.</span> The Competition
        </h2>
        
        <div className="overflow-hidden rounded-xl border-4 border-black shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-[#ffcc00]">
                <th className="p-6 uppercase font-black italic">Feature</th>
                <th className="p-6 uppercase font-black italic">J. Worden & Sons</th>
                <th className="p-6 uppercase font-black italic text-gray-300">Others</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              <tr className="border-b border-gray-200 text-black">
                <td className="p-6 bg-gray-50 uppercase text-xs">Stone Sub-Base</td>
                <td className="p-6 text-xl font-black">6-Inch Compacted</td>
                <td className="p-6 text-gray-200 font-normal">3 to 4-Inch Loose</td>
              </tr>
              <tr className="border-b border-gray-200 text-black">
                <td className="p-6 bg-gray-50 uppercase text-xs">Load Capacity</td>
                <td className="p-6 text-xl font-black">80,000 LB (Commercial Ready)</td>
                <td className="p-6 text-gray-200 font-normal">Residential Only</td>
              </tr>
              <tr className="bg-[#ffcc00]/10 text-black">
                <td className="p-6 bg-[#ffcc00] uppercase text-xs font-black">Expected Life</td>
                <td className="p-6 text-2xl font-black underline decoration-black/20">20-25 Years</td>
                <td className="p-6 text-gray-200 font-normal italic">8-12 Years</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-8 text-center text-gray-300 italic font-bold">
          "If you want to pave it twice, hire the cheap guy. If you want to pave it once, call the family who did it first."
        </p>
      </div>
    </section>
  )
}
