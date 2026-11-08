import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (!open) {
			return;
		}

		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setOpen(false);
			}
		};

		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.body.style.overflow = previous;
			document.removeEventListener('keydown', onKeyDown);
		};
	}, [open]);

	return (
		<>
			<img
				src={src}
				alt={alt}
				className={className}
				style={{ cursor: 'zoom-in' }}
				onClick={() => setOpen(true)}
			/>

			{open && createPortal(
				<div className="image-viewer" role="dialog" aria-modal="true" aria-label={alt}>
					<TransformWrapper
						initialScale={1}
						minScale={1}
						maxScale={6}
						centerOnInit
						limitToBounds
						wheel={{ step: 0.15 }}
						doubleClick={{ mode: 'zoomIn' }}
					>
						{({ zoomIn, zoomOut, resetTransform }) => (
							<>
								<div className="image-viewer-toolbar">
									<button type="button" aria-label="Zoom out" onClick={() => zoomOut()}>
										<ZoomOut size={20} />
									</button>
									<button type="button" aria-label="Reset zoom" onClick={() => resetTransform()}>
										<RotateCcw size={20} />
									</button>
									<button type="button" aria-label="Zoom in" onClick={() => zoomIn()}>
										<ZoomIn size={20} />
									</button>
									<button type="button" aria-label="Close image" onClick={() => setOpen(false)}>
										<X size={22} />
									</button>
								</div>

								<div className="image-viewer-stage">
									<TransformComponent
										wrapperStyle={{ width: '100%', height: '100%' }}
										contentStyle={{ width: '100%', height: '100%' }}
									>
										<img src={src} alt={alt} draggable={false} />
									</TransformComponent>
								</div>
							</>
						)}
					</TransformWrapper>
				</div>,
				document.body
			)}
		</>
	);
}