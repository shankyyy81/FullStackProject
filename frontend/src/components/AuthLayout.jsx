import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GOALS, tileInk } from '@/lib/sdg';
import { Wordmark } from './marks';

// Auth pages share the landing's palette: the form on sage, the goal grid on one olive square.
export default function AuthLayout({ title, subtitle, children, footer, photo }) {
    return (
        <div className="grid min-h-svh bg-field-sage text-ink lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-12">
                <Link to="/" className="self-start text-[17px]">
                    <Wordmark />
                </Link>
                <main className="flex w-full max-w-md flex-1 flex-col justify-center py-12 lg:mx-auto">
                    <h1 className="text-[clamp(2.25rem,4vw,3.25rem)] leading-[1.02] font-semibold tracking-[-0.03em]">{title}</h1>
                    <p className="mt-4 text-[17px] leading-7">{subtitle}</p>
                    <div className="mt-9">{children}</div>
                    <p className="mt-8 text-[15px] text-ink-soft">{footer}</p>
                </main>
            </div>

            <div className="relative hidden overflow-hidden bg-field-sage lg:block" aria-hidden="true">
                <div className="absolute top-[8%] -right-[18%] bottom-[-14%] left-[6%] bg-olive p-[clamp(1.5rem,3vw,3rem)]">
                    <ul className="grid max-w-[560px] grid-cols-6 gap-1.5">
                        {GOALS.map((g, i) => (
                            <motion.li
                                key={g.n}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 + i * 0.03, duration: 0.4, ease: [0.2, 0, 0, 1] }}
                                className="flex aspect-square items-start p-2 text-lg font-bold leading-none"
                                style={{ background: g.colour, color: tileInk(g) }}
                            >
                                {g.n}
                            </motion.li>
                        ))}
                    </ul>
                    {photo && (
                        <motion.img
                            src={photo.src}
                            width={1200}
                            height={900}
                            alt=""
                            initial={{ clipPath: 'inset(0 0 100% 0)' }}
                            animate={{ clipPath: 'inset(0 0 0% 0)' }}
                            transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1], delay: 0.5 }}
                            className="mt-1.5 aspect-[4/3] w-full max-w-[560px] object-cover grayscale"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
