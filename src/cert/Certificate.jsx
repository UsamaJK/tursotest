import "server-only";
import React from "react";

/**
 * Props:
 * - platform, logoUrl
 * - user: { name }
 * - level: "A1" | ... | "C2"
 * - ladder: ["A1","A2","B1","B2","C1","C2"]
 * - details: { certificateId, attemptId, issuedAt, region, descriptor }
 * - verifyUrl
 * - qrDataUrl (data:image/png;base64,...)
 */
export default function Certificate({ platform, logoUrl, user, level, ladder, details, verifyUrl, qrDataUrl }) {
  const navy = "#1A2D5A"; // header background + primary text
  const gold = "#D4A140"; // accent line/pill/underline
  const ink = "#2A2F45"; // main text
  const gray = "#6B7280"; // secondary text
  const card = "#F3F3F3"; // panel bg

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <style>{`
           * { box-sizing: border-box; }
           body { 
             margin: 0; 
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
             color: ${ink}; 
             -webkit-font-smoothing: antialiased;
             -webkit-print-color-adjust: exact !important;
             print-color-adjust: exact !important;
           }

          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
                 color: ${ink}; -webkit-font-smoothing: antialiased; }

          .wrap { width: 100%; position: relative; }

          /* Header - CENTERED - FULL WIDTH */
          .header {
            background: ${navy};
            color: white;
            padding: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin: 0;
            width: 100%;
          }
          
          /* Content container with margins */
          .content {
            padding: 0 14mm;
            margin-top: 0;
          }
          
          /* Logo with white background box */
          .logoBox {
            background: white;
            padding: 10px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }
          
          .header img { height: 45px; width: auto; display: block; }
          .platform { font-weight: 600; font-size: 15px; letter-spacing: .3px; }

          /* Title block */
          .title { text-align:center; margin: 14px 0 8px; }
          .title h1 { font-size: 36px; letter-spacing: 1px; margin: 30px 0 6px; color: ${"#243E76"}; font-weight: 700; }
          .subtitle { text-align:center; color:black; font-size:11px; margin-top: 3px; }
          .rule { height: 2px; background: ${"#EDC55D"}; width: 100%; margin: 14px 0 16px 0; }
          .rule-1{       background: #FAFBFB;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,.04);
            margin: 10px auto;
            max-width: 620px;
            margin-top: 20px}

          /* Lead + Name */
          .lead { text-align:center; color:#8B92A0; font-size:11.5px; margin-top: 25px; margin-bottom: 10px; }
          .name {
            text-align:center; font-size: 26px; font-weight: 700; color: ${"#2F487D"}; margin: 8px 0 12px;
            text-decoration: underline; text-decoration-thickness: 2.5px; text-underline-offset: 6px;
            text-decoration-color: ${"#EDC55D"};
          }

          /* Description sentence under name */
          .desc { text-align:center; color:#6B7280; font-size: 11.5px; line-height: 1.5; max-width: 550px; margin: 0 auto 12px; padding: 0 18px; }
          .desc b { color: ${"#FBCD63"}; font-weight: 800; }
          .bold { font-weight: bold; }

          /* Panels */
          .panel {
            background: ${"#F1F3F5"}; 
            border: 1px solid #E5E7EB; 
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,.04); 
            padding: 16px 18px; 
            margin: 10px auto; 
            max-width: 620px;
            margin-top: 20px
          }

          /* Level section */
          .levelTitle { 
            text-align: center; 
            color: #5D6F97; 
            font-size: 13px; 
            letter-spacing: .2px; 
            font-weight: 700; 
            margin-bottom: 10px; 
          }

          .ladder { 
            display: flex; 
            gap: 8px; 
            justify-content: center; 
            align-items: center; 
            margin: 10px 0 12px; 
          }
          
          .step { 
            border: 1px solid transparent; 
            border-radius: 4px; 
            width: 200px; 
            height: 100px;
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            gap: 3px; 
            color: ${gray}; 
            font-size: 10px;
            transition: all 0.2s ease;
          }
          
          .step .code { font-weight: 800; color: ${ink}; font-size: 14px; }
          .step .label { font-size: 10px; text-align:center }
          .sep { color: #9AA3B2; align-self: center; margin: 0 -2px; font-size: 14px; }

          .step.active {
            background: #FAC338; 
            border: 2px solid ${"#FAC338"};
            box-shadow: 0 4px 12px rgba(212, 161, 64, 0.3);
            transform: scale(1.04);
            position: relative;
            z-index: 1;
          }
          .step.active .code { color: ${navy}; font-size: 15px; }
          .step.active .label { color: ${ink}; font-weight: 700; text-align:center }

          .bullet { 
            background: white; 
            border-radius: 8px; 
            border: 1px solid #E5E7EB; 
            padding: 12px 14px; 
            font-size: 12px; 
            color: ${ink}; 
            line-height: 1.45; 
          }
          .bullet .descQuote { margin-top: 6px; font-style: italic; color: ${ink}; }

          /* Details grid */
          .detailsPanel {
            background: #FAFBFB;
            border: 1px solid #E5E7EB;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0,0,0,.04);
            padding: 16px 18px;
            margin: 10px auto;
            max-width: 620px;
            margin-top: 20px
          }
          
          .detailsTitle {
            font-size: 14px;
            font-weight: 600;
            color: #4D638F;
            margin-bottom: 12px;
          }
          
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
          .box { padding: 12px 14px; }
          .metaLabel { font-size: 10px; color: #989EAF; letter-spacing: .2px; text-transform: uppercase; margin-bottom: 3px; }
          .metaValue { font-size: 10px; font-weight: 400; color: #555862; margin-top: 2px; }

          /* Verification row: text left, QR right */
          .verify { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding-left:35px; padding-right:30px; padding-top:25px; }
          .verifyLeft { flex: 1; }
          .verifyTitle { font-size: 12px; font-weight: 400; color: ${"#556A94"}; margin-bottom: 12px; }
          .verifyText { font-size: 11px; color: ${gray}; line-height: 2.4; }
          .verifyUrl { 
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            font-size: 11px; 
            color: #FACD6A; 
            border-radius: 5px; 
            display: inline-block; 
            margin-top: 4px;
            word-break: break-all;
          }
          .qrWrap { 
            background: white; 
            border: 1px solid #E5E7EB; 
            border-radius: 10px; 
            padding: 8px;
            flex-shrink: 0;
          }
          .qr { width: 100px; height: 100px; border: none; border-radius: 6px; object-fit: contain; }

          .footerNote { color: ${"#A2A6B3"}; font-size: 10px; margin-top: 5px; font-style: italic; max-width: 450px; }
          
          /* Bottom gold line */
          .bottomRule {
            height: 5px;
            background: ${"#847446"};
            margin-top: 12mm;
            margin-bottom: 12mm;
          }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          {/* Header - CENTERED */}
          <div className="header">
            {logoUrl ? (
              <div className="logoBox">
                <img src={logoUrl} alt="Logo" />
              </div>
            ) : null}
            <div className="platform">{platform}</div>
          </div>

          {/* Main title */}
          <div className="content">
            <div className="title">
              <h1>CERTIFICATE</h1>
              <div className="subtitle">of English Proficiency</div>
            </div>
            <div className="rule" />
            <div className="lead">This is to certify that</div>
            <div className="name">{user.name}</div>
            <div className="desc">
              has successfully completed the English Proficiency Test on platform.com and has demonstrated the <b>{level}</b> level of English in
              accordance with the Common European Framework of <span className="bold">Reference for Languages (CEFR)</span>.
            </div>
            {/* Level panel */}
            <div className="panel">
              <div className="levelTitle">Level Achieved</div>

              {/* Ladder */}
              <div className="ladder" aria-label="Level ladder">
                {ladder.map((code, i) => (
                  <React.Fragment key={code}>
                    <div className={`step ${code === level ? "active" : ""}`}>
                      <div className="code">{code}</div>
                      <div className="label">{levelLabel(code)}</div>
                    </div>
                    {i < ladder.length - 1 ? <div className="sep">→</div> : null}
                  </React.Fragment>
                ))}
              </div>

              {/* Descriptor */}
              <div className="bullet">
                <span style={{ background: "#FAC137", color: "#75663C", padding: "3px 10px", borderRadius: 999, fontSize: 10.5, fontWeight: 700 }}>
                  {level} — {levelLabel(level)}
                </span>
                <div className="descQuote">"{details.descriptor}"</div>
              </div>
            </div>
            {/* Details panel */}
            <div className="detailsPanel">
              <div className="detailsTitle">Certificate Details</div>
              <div className="grid">
                <div className="box">
                  <div className="metaLabel">Certificate ID</div>
                  <div className="metaValue">{details.certificateId}</div>
                </div>
                <div className="box">
                  <div className="metaLabel">Attempt ID</div>
                  <div className="metaValue">{details.attemptId}</div>
                </div>
                <div className="box">
                  <div className="metaLabel">Date of Issue</div>
                  <div className="metaValue">{formatDate(details.issuedAt)}</div>
                </div>
                <div className="box">
                  <div className="metaLabel">Region</div>
                  <div className="metaValue">{details.region}</div>
                </div>
              </div>
            </div>
            <div className="rule-1" />

            {/* Verification row (text left, QR right) */}
            <div className="verify">
              <div className="verifyLeft">
                <div className="verifyTitle">Verification</div>
                <div className="verifyText">
                  To verify the authenticity of this certificate, scan the QR code or visit:
                  <div className="verifyUrl">{verifyUrl}</div>
                </div>
                <div className="footerNote">
                  This certificate is digitally issued and verified by English Proficiency Platform Assessment System no manual signature required.
                </div>
              </div>
              <div className="qrWrap">
                <img className="qr" src={qrDataUrl} alt="Verification QR" />
              </div>
            </div>
            {/* Bottom gold line */}
            <div className="bottomRule" />
          </div>
        </div>
      </body>
    </html>
  );
}

function shortLabel(code) {
  switch (code) {
    case "A1":
      return "Beginner";
    case "A2":
      return "Elementary";
    case "B1":
      return "Intermediate";
    case "B2":
      return "Upper";
    case "C1":
      return "Advanced";
    case "C2":
      return "Proficient";
    default:
      return "";
  }
}
function levelLabel(code) {
  switch (code) {
    case "A1":
      return "Beginner";
    case "A2":
      return "Elementary";
    case "B1":
      return "Intermediate";
    case "B2":
      return "Upper Intermediate";
    case "C1":
      return "Advanced";
    case "C2":
      return "Proficiency";
    default:
      return "";
  }
}
function formatDate(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
