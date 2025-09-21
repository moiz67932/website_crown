'use client'
import Script from 'next/script'

export default function Heatmap() {
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID || process.env.HOTJAR_ID
  const clarityTag = process.env.NEXT_PUBLIC_CLARITY_TAG || process.env.CLARITY_TAG

  if (hotjarId) {
    return (
      <Script id="hotjar" strategy="afterInteractive">
        {`
          (function(h,o,t,j,a,r){
            h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${Number(hotjarId)},hjsv:6};
            a=o.getElementsByTagName('head')[0];
            r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
            a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        `}
      </Script>
    )
  }
  if (clarityTag) {
    return (
      <Script id="clarity" strategy="afterInteractive">
        {`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityTag}");
        `}
      </Script>
    )
  }
  return null
}