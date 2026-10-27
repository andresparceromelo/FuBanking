"""
Generador del Plan de Pruebas FuBank v2.0 con Diseño Corporativo Personalizado.
Enfoque colaborativo y horizontal de equipo (4 módulos con igual jerarquía e importancia).
Garantiza paginación nativa y renderizado completo en Microsoft Word (16 páginas).
"""
import os
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

# ===== PALETA DE COLORES INSTITUCIONAL =====
HEX_PRIMARY = "820AD1"          # Púrpura FuBank
HEX_PRIMARY_DARK = "581C87"     # Púrpura profundo
HEX_INDIGO = "1E1B4B"           # Índigo oscuro para títulos
HEX_ACCENT_BG = "FAF5FF"        # Fondo suave violeta para filas y callouts
HEX_CARD_BG = "F3E8FF"          # Púrpura claro para bordes y separadores
HEX_BORDER = "E9D5FF"           # Borde horizontal suave
HEX_TEXT_DARK = "1F2937"        # Carbón oscuro para texto
HEX_TEXT_MUTED = "6B7280"       # Gris pizarra para subtítulos
HEX_SUCCESS = "059669"          # Verde esmeralda (Pass)

COLOR_PRIMARY = RGBColor(130, 10, 209)
COLOR_PRIMARY_DARK = RGBColor(88, 28, 135)
COLOR_INDIGO = RGBColor(30, 27, 75)
COLOR_TEXT_DARK = RGBColor(31, 41, 55)
COLOR_TEXT_MUTED = RGBColor(107, 114, 128)
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_SUCCESS = RGBColor(5, 150, 105)

# ===== RUTAS =====
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO_PATH = os.path.join(BASE_DIR, "frontend", "public", "logo.png")
OUTPUT_DOCX = os.path.join(BASE_DIR, "docs", "plan-de-pruebas-fubank-v2.docx")

# ===== HELPERS OPENXML =====

def set_cell_background(cell, hex_color):
    """Aplica color de fondo a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hex_color)
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    """Establece márgenes internos de celda en dxa."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_borders(cell, top=None, bottom=None, left=None, right=None):
    """Aplica bordes específicos a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    borders = {'top': top, 'bottom': bottom, 'left': left, 'right': right}
    for b_name, b_val in borders.items():
        node = OxmlElement(f'w:{b_name}')
        if b_val:
            node.set(qn('w:val'), b_val.get('val', 'single'))
            node.set(qn('w:sz'), str(b_val.get('sz', 4)))
            node.set(qn('w:space'), '0')
            node.set(qn('w:color'), b_val.get('color', HEX_BORDER))
        else:
            node.set(qn('w:val'), 'none')
        tcBorders.append(node)
    tcPr.append(tcBorders)

def set_table_borders(table, border_color=HEX_BORDER):
    """Aplica bordes horizontales limpios y elimina bordes verticales."""
    tblPr = table._tbl.tblPr
    tblBorders = OxmlElement('w:tblBorders')
    for b in ['top', 'bottom', 'insideH']:
        border = OxmlElement(f'w:{b}')
        border.set(qn('w:val'), 'single')
        border.set(qn('w:sz'), '4')
        border.set(qn('w:space'), '0')
        border.set(qn('w:color'), border_color)
        tblBorders.append(border)
    for b in ['left', 'right', 'insideV']:
        border = OxmlElement(f'w:{b}')
        border.set(qn('w:val'), 'none')
        tblBorders.append(border)
    tblPr.append(tblBorders)

def add_field(p, field_name):
    """Inserta un campo nativo dinámico de Word (PAGE o NUMPAGES)."""
    r = p.add_run()
    fldSimple = OxmlElement('w:fldSimple')
    fldSimple.set(qn('w:instr'), field_name)
    r._r.append(fldSimple)

def build_document():
    doc = Document()

    # Configuración de márgenes estándar de informe
    section = doc.sections[0]
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

    # Portada independiente: encabezado y pie de página limpios en página 1
    section.different_first_page_header_footer = True

    # Tipografía base
    style_normal = doc.styles['Normal']
    font_normal = style_normal.font
    font_normal.name = 'Segoe UI'
    font_normal.size = Pt(10)
    font_normal.color.rgb = COLOR_TEXT_DARK

    # ==============================================================
    # 1. PORTADA CORPORATIVA (EQUIPO COLABORATIVO FU-BANK)
    # ==============================================================

    # Banda decorativa superior
    top_band = doc.add_table(rows=1, cols=1)
    top_band.alignment = WD_TABLE_ALIGNMENT.CENTER
    top_band.autofit = False
    top_band.columns[0].width = Inches(6.5)
    cell_band = top_band.rows[0].cells[0]
    set_cell_background(cell_band, HEX_PRIMARY)
    set_cell_margins(cell_band, top=60, bottom=60, left=100, right=100)
    p_band = cell_band.paragraphs[0]
    p_band.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    r_band = p_band.add_run("FUBANK QUALITY ASSURANCE · EQUIPO DE TESTING 2026-2  ")
    r_band.font.size = Pt(8)
    r_band.font.bold = True
    r_band.font.color.rgb = COLOR_WHITE

    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_before = Pt(16)

    # Logo institucional
    if os.path.exists(LOGO_PATH):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_logo = p_logo.add_run()
        run_logo.add_picture(LOGO_PATH, width=Inches(2.2))
        p_logo.paragraph_format.space_after = Pt(12)

    # Badge normativo
    p_pill = doc.add_paragraph()
    p_pill.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_pill.paragraph_format.space_after = Pt(8)
    run_pill = p_pill.add_run("   ISTQB FOUNDATION  ·  ISO/IEC/IEEE 29119  ·  ISO/IEC 25010   ")
    run_pill.font.size = Pt(8.5)
    run_pill.font.bold = True
    run_pill.font.color.rgb = COLOR_PRIMARY_DARK

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_after = Pt(4)
    run_title = p_title.add_run("PLAN DE PRUEBAS DE SOFTWARE")
    run_title.font.size = Pt(24)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    # Subtítulo del Sistema
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(6)
    run_sub = p_sub.add_run("Sistema Bancario Web FuBank — Versión 2.0")
    run_sub.font.size = Pt(13)
    run_sub.font.bold = True
    run_sub.font.color.rgb = COLOR_INDIGO

    p_sub2 = doc.add_paragraph()
    p_sub2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub2.paragraph_format.space_after = Pt(18)
    run_sub2 = p_sub2.add_run("Aseguramiento Integral de Calidad: Autenticación, Créditos, Bolsillos y Tarjetas Virtuales")
    run_sub2.font.size = Pt(9.5)
    run_sub2.font.color.rgb = COLOR_TEXT_MUTED

    # Ficha Técnica en Tarjeta Estilizada (Colaborativa y Horizontal)
    card_table = doc.add_table(rows=6, cols=2)
    card_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    card_table.autofit = False
    card_table.columns[0].width = Inches(2.2)
    card_table.columns[1].width = Inches(4.3)

    meta_items = [
        ("Proyecto y Arquitectura", "FuBanking (Express 5 + TypeScript + Next.js 16 + Supabase)"),
        ("Módulos en Alcance (4)", "Usuarios/Auth, Créditos/Loans, Bolsillos/Pockets, Tarjetas/Cards"),
        ("Equipo de Aseguramiento", "Andres Bedoya, Dubin Soto, Tomas Henao, Stiven Bustamante"),
        ("Modelo de Trabajo", "Equipo Horizontal de Aseguramiento QA (Sin jerarquías)"),
        ("Fecha de Cierre y Commit", "26 de Octubre de 2026 — Versión 2.0 (Rama dev)"),
        ("Curso Académico", "Validación y Verificación de Software — Semestre 2026-2"),
    ]

    for idx, (label, val) in enumerate(meta_items):
        row = card_table.rows[idx]
        cell_lbl, cell_val = row.cells[0], row.cells[1]

        set_cell_background(cell_lbl, HEX_ACCENT_BG)
        set_cell_background(cell_val, HEX_ACCENT_BG)
        set_cell_margins(cell_lbl, top=65, bottom=65, left=140, right=100)
        set_cell_margins(cell_val, top=65, bottom=65, left=100, right=140)

        left_b = {'val': 'single', 'sz': 24, 'color': HEX_PRIMARY}
        set_cell_borders(cell_lbl, left=left_b, top={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG}, bottom={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG})
        set_cell_borders(cell_val, top={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG}, bottom={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG})

        p_l = cell_lbl.paragraphs[0]
        p_l.paragraph_format.space_after = Pt(0)
        r_l = p_l.add_run(label)
        r_l.font.size = Pt(9)
        r_l.font.bold = True
        r_l.font.color.rgb = COLOR_PRIMARY_DARK

        p_v = cell_val.paragraphs[0]
        p_v.paragraph_format.space_after = Pt(0)
        r_v = p_v.add_run(val)
        r_v.font.size = Pt(9)
        r_v.font.color.rgb = COLOR_TEXT_DARK

    p_bottom = doc.add_paragraph()
    p_bottom.paragraph_format.space_before = Pt(24)
    p_bottom.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_bot = p_bottom.add_run("Medellín, Colombia · Semestre 2026-2")
    r_bot.font.size = Pt(8.5)
    r_bot.font.color.rgb = COLOR_TEXT_MUTED

    doc.add_page_break()

    # ==============================================================
    # 2. ENCABEZADO Y PIE DE PÁGINA (Páginas 2 en adelante)
    # ==============================================================
    header = section.header
    for p in header.paragraphs:
        p.text = ""

    header_table = header.add_table(rows=1, cols=2, width=Inches(6.5))
    header_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    header_table.columns[0].width = Inches(4.5)
    header_table.columns[1].width = Inches(2.0)

    cell_hl, cell_hr = header_table.rows[0].cells[0], header_table.rows[0].cells[1]
    set_cell_margins(cell_hl, top=40, bottom=40, left=40, right=40)
    set_cell_margins(cell_hr, top=40, bottom=40, left=40, right=40)
    border_rule = {'val': 'single', 'sz': 4, 'color': HEX_BORDER}
    set_cell_borders(cell_hl, bottom=border_rule)
    set_cell_borders(cell_hr, bottom=border_rule)

    p_hl = cell_hl.paragraphs[0]
    p_hl.paragraph_format.space_after = Pt(0)
    r_hl = p_hl.add_run("FuBank · Plan de Pruebas de Software v2.0")
    r_hl.font.size = Pt(8.5)
    r_hl.font.bold = True
    r_hl.font.color.rgb = COLOR_PRIMARY_DARK

    p_hr = cell_hr.paragraphs[0]
    p_hr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_hr.paragraph_format.space_after = Pt(0)
    r_hr = p_hr.add_run("Confidencial · Uso Académico")
    r_hr.font.size = Pt(8)
    r_hr.font.color.rgb = COLOR_TEXT_MUTED

    footer = section.footer
    for p in footer.paragraphs:
        p.text = ""

    footer_table = footer.add_table(rows=1, cols=2, width=Inches(6.5))
    footer_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    footer_table.columns[0].width = Inches(4.5)
    footer_table.columns[1].width = Inches(2.0)

    cell_fl, cell_fr = footer_table.rows[0].cells[0], footer_table.rows[0].cells[1]
    set_cell_margins(cell_fl, top=40, bottom=40, left=40, right=40)
    set_cell_margins(cell_fr, top=40, bottom=40, left=40, right=40)
    set_cell_borders(cell_fl, top=border_rule)
    set_cell_borders(cell_fr, top=border_rule)

    p_fl = cell_fl.paragraphs[0]
    p_fl.paragraph_format.space_after = Pt(0)
    r_fl = p_fl.add_run("Validación y Verificación de Software — EAFIT / Paradigmas 2026-2")
    r_fl.font.size = Pt(8)
    r_fl.font.color.rgb = COLOR_TEXT_MUTED

    p_fr = cell_fr.paragraphs[0]
    p_fr.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_fr.paragraph_format.space_after = Pt(0)
    r_fr = p_fr.add_run("Página ")
    r_fr.font.size = Pt(8.5)
    r_fr.font.color.rgb = COLOR_TEXT_MUTED
    add_field(p_fr, "PAGE")
    r_fr2 = p_fr.add_run(" de ")
    r_fr2.font.size = Pt(8.5)
    r_fr2.font.color.rgb = COLOR_TEXT_MUTED
    add_field(p_fr, "NUMPAGES")

    # ==============================================================
    # HELPERS DE CONTENIDO CON ESTILO
    # ==============================================================

    def add_h1(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.size = Pt(14)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.size = Pt(11.5)
        r.font.bold = True
        r.font.color.rgb = COLOR_INDIGO
        return p

    def add_body(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(text)
        r.font.size = Pt(9.5)
        r.font.color.rgb = COLOR_TEXT_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.25)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r_bullet = p.add_run("▪  ")
        r_bullet.font.size = Pt(8.5)
        r_bullet.font.bold = True
        r_bullet.font.color.rgb = COLOR_PRIMARY
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.size = Pt(9.5)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_TEXT_DARK
        r_text = p.add_run(text)
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = COLOR_TEXT_DARK
        return p

    def add_callout(title, text):
        t = doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = False
        t.columns[0].width = Inches(6.5)
        cell = t.rows[0].cells[0]
        set_cell_background(cell, HEX_ACCENT_BG)
        set_cell_margins(cell, top=80, bottom=80, left=140, right=120)
        set_cell_borders(cell, left={'val': 'single', 'sz': 24, 'color': HEX_PRIMARY}, top={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG}, bottom={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG}, right={'val': 'single', 'sz': 4, 'color': HEX_CARD_BG})

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        r_t = p.add_run(f"📌 {title}: ")
        r_t.font.bold = True
        r_t.font.size = Pt(9.5)
        r_t.font.color.rgb = COLOR_PRIMARY_DARK
        r_b = p.add_run(text)
        r_b.font.size = Pt(9.5)
        r_b.font.color.rgb = COLOR_TEXT_DARK
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(2)

    def add_styled_table(headers, rows, col_widths=None):
        table = doc.add_table(rows=1 + len(rows), cols=len(headers))
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        table.autofit = False

        if col_widths and len(col_widths) == len(headers):
            for i, w in enumerate(col_widths):
                table.columns[i].width = Inches(w)

        # Fila de cabecera en Morado FuBank
        hdr_row = table.rows[0]
        for i, header_text in enumerate(headers):
            cell = hdr_row.cells[i]
            set_cell_background(cell, HEX_PRIMARY)
            set_cell_margins(cell, top=90, bottom=90, left=120, right=120)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(header_text)
            run.font.bold = True
            run.font.size = Pt(9)
            run.font.color.rgb = COLOR_WHITE

        # Filas cebradas
        for r_idx, row_data in enumerate(rows):
            row = table.rows[1 + r_idx]
            bg_color = HEX_ACCENT_BG if r_idx % 2 == 1 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cell = row.cells[c_idx]
                set_cell_background(cell, bg_color)
                set_cell_margins(cell, top=70, bottom=70, left=120, right=120)
                p = cell.paragraphs[0]
                p.paragraph_format.space_after = Pt(0)

                if "PASS" in val or "✅" in val:
                    r = p.add_run(val)
                    r.font.bold = True
                    r.font.size = Pt(9)
                    r.font.color.rgb = COLOR_SUCCESS
                elif "Crítica" in val or "FAIL" in val:
                    r = p.add_run(val)
                    r.font.bold = True
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(220, 38, 38)
                elif "Alta" in val:
                    r = p.add_run(val)
                    r.font.bold = True
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(217, 119, 6)
                else:
                    r = p.add_run(val)
                    r.font.size = Pt(9)
                    r.font.color.rgb = COLOR_TEXT_DARK

        set_table_borders(table, HEX_BORDER)
        p_sp = doc.add_paragraph()
        p_sp.paragraph_format.space_after = Pt(4)
        return table

    # ==============================================================
    # TABLA DE CONTENIDO EJECUTIVA
    # ==============================================================
    add_h1("ÍNDICE GENERAL DEL DOCUMENTO")
    add_body("Estructura formal del Plan de Pruebas basada en el estándar internacional ISO/IEC/IEEE 29119:")

    toc_items = [
        ["1. Introducción", "Propósito, alcance referencial y normativas ISTQB / ISO 29119"],
        ["2. Descripción del Producto", "Arquitectura Clean Architecture, contexto web y tecnologías"],
        ["3. Base de Pruebas (Test Basis)", "Requisitos Funcionales (RF-01..81) e Historias de Usuario (HU-27..32)"],
        ["4. Objetivos de las Pruebas", "Integridad de saldos, seguridad JWT/2FA y flujos de negocio"],
        ["5. Alcance (Scope)", "Los 4 módulos incluidos, exclusiones justificadas, supuestos y restricciones"],
        ["6. Enfoque y Estrategia de Pruebas", "Pirámide ampliada con IA y 3 herramientas avanzadas de observabilidad"],
        ["7. Niveles de Prueba", "Pruebas unitarias, integración API, pruebas de sistema y aceptación BDD"],
        ["8. Tipos de Prueba", "Pruebas funcionales, no funcionales (seguridad/a11y), estáticas y regresión"],
        ["9. Técnicas de Diseño de Pruebas", "Partición de equivalencia, valores límite, tablas de decisión y SBTM"],
        ["10. Entorno de Pruebas", "Topología de servidores (:3001, :3000), Supabase Cloud, Docker y CI/CD"],
        ["11. Datos de Prueba", "Usuarios precargados (cliente/admin) y datasets financieros de prueba"],
        ["12. Criterios de Prueba", "Criterios de entrada, salida y aceptación formal por módulo"],
        ["13. Gestión de Defectos", "Flujo de vida del defecto, matriz de severidad y seguimiento"],
        ["14. Identificación y Análisis de Riesgos", "Matriz de 10 riesgos evaluados con probabilidad, impacto y mitigación"],
        ["15. Organización y Responsabilidades", "Asignación colaborativa de módulos y roles de los 4 integrantes"],
        ["16. Cronograma de Pruebas", "Calendario de 14 semanas de actividades (julio a octubre 2026)"],
        ["17. Métricas y Seguimiento", "Cobertura de 49 verificaciones activas, SonarQube y control de bugs"],
        ["18. Entregables de Prueba", "Inventario de repositorios, suites Cypress, Serenity, Stagehand y MCP"],
        ["19. Informe Final de Pruebas", "Resumen ejecutivo, resultados con 100% pass rate y conclusiones"],
        ["20. Gestión del Documento", "Historial de versiones, registro de cambios y firmas de aprobación del equipo"],
    ]

    add_styled_table(["Sección", "Alcance y Descripción"], toc_items, [2.3, 4.2])

    doc.add_page_break()

    # ==============================================================
    # SECCIÓN 1: INTRODUCCIÓN
    # ==============================================================
    add_h1("1. INTRODUCCIÓN")
    add_h2("1.1 Propósito del documento")
    add_body(
        "Este documento establece la estrategia, alcance, organización y seguimiento del proceso de pruebas "
        "para el sistema bancario digital FuBank. Su propósito es estructurar el marco de verificación y validación "
        "del software construido previamente, cumpliendo rigurosamente con las directrices del ISTQB (International "
        "Software Testing Qualifications Board) y la normativa internacional ISO/IEC/IEEE 29119."
    )

    add_h2("1.2 Alcance del documento")
    add_body(
        "El documento define el alcance de las evaluaciones funcionales y no funcionales aplicadas a FuBank, "
        "abarcando de forma integral cada etapa del ciclo de vida del testing: diseño formal de escenarios, ejecución "
        "automatizada, registro y seguimiento de defectos, y el balance final de cierre de calidad de los 4 módulos del sistema."
    )

    add_h2("1.3 Referencias normativas y de proyecto")
    add_bullet(" — Estándar metodológico para el ciclo de pruebas.", "ISTQB Foundation Level Syllabus (v4.0):")
    add_bullet(" — Estándar internacional para procesos y documentación de pruebas de software.", "ISO/IEC/IEEE 29119 Software Testing:")
    add_bullet(" — Modelo de calidad del producto software (funcionalidad, fiabilidad, usabilidad, seguridad).", "ISO/IEC 25010 Systems and Software Quality:")
    add_bullet(" — Rama dev de integración continua del proyecto.", "Repositorio GitHub:")
    add_bullet(" — Especificación técnica de endpoints y contratos REST.", "Documentación interna:")

    # ==============================================================
    # SECCIÓN 2: DESCRIPCIÓN DEL PRODUCTO
    # ==============================================================
    add_h1("2. DESCRIPCIÓN DEL PRODUCTO")
    add_h2("2.1 Descripción general del software")
    add_body(
        "FuBank es una aplicación bancaria web moderna cuyo propósito es brindar una plataforma digital intuitiva, "
        "confiable y segura para centralizar la gestión financiera personal. Responde a la problemática de la "
        "dependencia de oficinas bancarias tradicionales, habilitando la apertura y consulta de cuentas de ahorro, "
        "transferencias en línea, bolsillos de ahorro programado, tramitación y simulación de créditos y emisión de tarjetas virtuales."
    )
    add_body(
        "El sistema soporta dos perfiles principales: Clientes (usuarios finales con control autónomo de sus finanzas) "
        "y Administradores (responsables de auditar, verificar elegibilidad y gestionar operativamente las solicitudes del ecosistema)."
    )

    add_h2("2.2 Contexto organizacional y operativo")
    add_body(
        "FuBank está diseñado como una Single Page Application (SPA) Mobile Responsive para garantizar accesibilidad fluida "
        "en computadores de escritorio y dispositivos móviles. Emplea Supabase (PostgreSQL gestionado en la nube) "
        "para garantizar la integridad transaccional de los balances financieros. La seguridad operacional se apoya en "
        "tokens JWT de sesión complementados con un flujo de autenticación de dos factores (2FA vía TOTP/correo)."
    )

    add_h2("2.3 Arquitectura general del sistema")
    add_body(
        "El backend está construido bajo los principios de Arquitectura Limpia (Clean Architecture), "
        "desacoplando de forma estricta las capas del sistema:"
    )
    add_bullet("Controladores Express 5, rutas versionadas (/api/v1) y validadores Zod.", "Presentation Layer: ")
    add_bullet("Casos de uso puros (Use Cases) y DTOs que orquestan las operaciones de negocio.", "Application Layer: ")
    add_bullet("Entidades centrales del dominio bancario, servicios de dominio (LoanCalculator) y reglas de negocio.", "Domain Layer: ")
    add_bullet("Repositorios Supabase, clientes de correo y adaptadores externos.", "Infrastructure Layer: ")

    add_callout(
        "Stack Tecnológico Unificado",
        "Backend en Node.js 22 + Express 5 + TypeScript (puerto :3001). Frontend en React 19 + Next.js 16 + Tailwind CSS (puerto :3000). "
        "Base de datos PostgreSQL en Supabase. Seguridad: middlewares authMiddleware y adminMiddleware."
    )

    add_h2("2.4 Procesos, módulos y funcionalidades bajo evaluación")
    add_styled_table(
        ["Módulo", "Funcionalidades Principales en Alcance", "Integrante Responsable"],
        [
            ["Autenticación & Seguridad", "Registro, login/logout, tokens JWT, verificación 2FA, reseteo de contraseña", "Dubin Andres Soto"],
            ["Créditos y Préstamos", "Simulador de cuotas, envío de solicitud, historial, aprobación/rechazo admin", "Andres Bedoya Cano"],
            ["Ahorros (Bolsillos)", "Creación, edición, eliminación de bolsillos, abonos y retiros de cuenta", "Tomas Henao"],
            ["Tarjetas Virtuales", "Emisión de tarjetas, revelación segura de datos sensibles, bloqueo/desbloqueo", "Stiven Alejandro Bustamante"],
        ],
        [1.8, 3.2, 1.5]
    )

    # ==============================================================
    # SECCIÓN 3: BASE DE PRUEBAS
    # ==============================================================
    add_h1("3. BASE DE PRUEBAS (TEST BASIS)")
    add_body(
        "La base de pruebas comprende todos los artefactos de ingeniería y especificaciones utilizados como "
        "referencia para derivar las condiciones y casos de prueba de los cuatro módulos del sistema:"
    )
    add_styled_table(
        ["Artefacto de Referencia", "Descripción y Alcance", "Módulos Cubiertos"],
        [
            ["Requisitos Funcionales (RF-01 a RF-81)", "Catálogo formal de requisitos funcionales del sistema", "Auth, Loans, Pockets, Cards"],
            ["Historias de Usuario (HU)", "Backlog ágil y criterios de aceptación por módulo", "Todos los módulos"],
            ["Código Fuente de Producción", "backend/src/ y frontend/src/ auditados bajo Clean Architecture", "Totalidad del sistema"],
            ["Contratos API (docs/api/endpoints.md)", "Especificación HTTP formal: payloads, headers y status codes", "Integración REST"],
            ["Escenarios BDD (Gherkin)", "Criterios de aceptación formalizados en lenguaje natural", "Flujos E2E de negocio"],
            ["Historial Git (23/07/2026 - 26/10/2026)", "Registro de commits, refactorizaciones y fixes de calidad", "Trazabilidad continua"],
        ],
        [2.2, 3.0, 1.3]
    )

    # ==============================================================
    # SECCIÓN 4: OBJETIVOS DE LAS PRUEBAS
    # ==============================================================
    add_h1("4. OBJETIVOS DE LAS PRUEBAS")
    add_bullet("Verificar que los requisitos funcionales de los 4 módulos cumplan con las especificaciones técnicas.", "RF Cumplidos: ")
    add_bullet("Validar la integridad transaccional de movimientos entre cuenta principal y bolsillos sin duplicación o pérdida de fondos.", "Integridad Financiera: ")
    add_bullet("Confirmar la robustez de los mecanismos de seguridad (bloqueo por 429, protección de rutas 401/403, tokens alterados).", "Seguridad Estricta: ")
    add_bullet("Asegurar que el flujo de aprobación y rechazo de solicitudes actualice estados atómicamente y genere cuentas de crédito.", "Ciclo de Créditos: ")
    add_bullet("Identificar y corregir oportunamente cualquier defecto de severidad Alta o Crítica antes del cierre del ciclo.", "Mitigación de Bugs: ")
    add_bullet("Implementar y sustentar 3 tecnologías avanzadas de prueba: Playwright MCP, Cypress Cloud + AI y ReportPortal.", "Objetivo de Vanguardia: ")

    # ==============================================================
    # SECCIÓN 5: ALCANCE
    # ==============================================================
    add_h1("5. ALCANCE (SCOPE)")
    add_h2("5.1 Funcionalidades incluidas")
    add_bullet("Módulo Auth: Registro (RF-01..03), login/logout (RF-04..07), 2FA (RF-11..14), perfil (RF-15..17).")
    add_bullet("Módulo Bolsillos: Creación (RF-43,44), consulta (RF-45), abonos y retiros de cuenta (RF-48..51).")
    add_bullet("Módulo Créditos: Simulación (RF-52..54), solicitud (RF-55,56), consulta (RF-57,58), gestión admin (RF-60..63).")
    add_bullet("Módulo Tarjetas: Emisión (RF-64,65), listado (RF-66,67), datos sensibles (RF-69), bloqueo (RF-70..72).")
    add_bullet("Transversal: Notificaciones del sistema generadas por eventos bancarios clave (RF-76, 78, 81).")

    add_h2("5.2 Funcionalidades excluidas y justificación")
    add_bullet("Operativa directa de depósitos y retiros en ventanilla como módulo aislado (cubierto indirectamente por bolsillos).", "Cuentas bancarias directas: ")
    add_bullet("Módulo de transferencias interbancarias masivas por estar fuera del alcance del sprint.", "Transferencias externas: ")
    add_bullet("Pruebas de estrés masivo a escala de decenas de miles de usuarios concurrentes (se aplican pruebas de rendimiento educativo).", "Carga extrema: ")
    add_bullet("Integración con pasarelas de pago externas reales (PSE/ACH/Redeban).", "Pasarelas externas: ")

    add_h2("5.3 Supuestos y Restricciones")
    add_bullet("Disponibilidad del ambiente local de pruebas con backend en :3001 y frontend en :3000.", "Supuesto: ")
    add_bullet("Datos de prueba precargados para usuarios clientes y administradores con credenciales conocidas.", "Supuesto: ")
    add_bullet("Equipo conformado por 4 ingenieros de pruebas con dedicación académica semestral colaborativa.", "Restricción: ")
    add_bullet("Uso de cuotas gratuitas de API de Google Gemini para las pruebas exploratorias con Stagehand.", "Restricción: ")

    # ==============================================================
    # SECCIÓN 6: ENFOQUE Y ESTRATEGIA DE PRUEBAS
    # ==============================================================
    add_h1("6. ENFOQUE Y ESTRATEGIA DE PRUEBAS")
    add_body(
        "Se adoptó una Pirámide de Pruebas Ampliada con Inteligencia Artificial, que combina pruebas tradicionales "
        "deterministas con pruebas semánticas y observabilidad centralizada para todo el sistema:"
    )

    add_bullet("Stagehand + Gemini Flash 2.0 (3 escenarios exploratorios sin selectores rígidos).", "Capa 4 — E2E con IA: ")
    add_bullet("Cypress 15.21.1 (18 specs) + Serenity/JS Screenplay (7 escenarios Gherkin).", "Capa 3 — E2E Funcional & BDD: ")
    add_bullet("Vitest HTTP requests validando contratos REST, códigos 200/201/400/401/403/429.", "Capa 2 — Integración API: ")
    add_bullet("Vitest sobre Domain Services (LoanCalculator), Use Cases y validadores Zod.", "Capa 1 — Unitarias: ")

    add_callout(
        "3 Herramientas Avanzadas Implementadas",
        "1. Microsoft Playwright MCP Server (@playwright/mcp): automatización browser controlada mediante protocolo MCP por agentes IA.\n"
        "2. Cypress Cloud + Studio AI: dashboard en la nube (Project ID: ypgf2b) con Test Replay y comando cy.prompt().\n"
        "3. ReportPortal (Docker :8088): ingestión unificada de resultados Cypress y Playwright con métricas de salud en tiempo real."
    )

    # ==============================================================
    # SECCIÓN 7: NIVELES DE PRUEBA
    # ==============================================================
    add_h1("7. NIVELES DE PRUEBA")
    add_h2("7.1 Pruebas de Componente (Unitarias)")
    add_body(
        "Ejecutadas con Vitest en backend y frontend. En backend cubren la capa Domain (LoanCalculator, LoanApplication, Pocket, User) "
        "y Application (casos de uso de los cuatro módulos). En frontend cubren los hooks y componentes aislados."
    )

    add_h2("7.2 Pruebas de Integración")
    add_body(
        "Verifican la comunicación entre Presentation (controladores Express), Application (casos de uso) "
        "y la persistencia en Supabase. Se certifican los endpoints de los módulos con respuestas HTTP reales."
    )

    add_h2("7.3 Pruebas de Sistema")
    add_body(
        "Validan el flujo completo del sistema integrado desplegado localmente. Cypress automatiza pruebas "
        "end-to-end cubriendo registro, autenticación, simulación, solicitud, ciclo de aprobación y seguridad."
    )

    add_h2("7.4 Pruebas de Aceptación")
    add_body(
        "Formalizadas con Serenity/JS + Cucumber bajo el patrón Screenplay. Escenarios Gherkin en lenguaje "
        "natural certifican el cumplimiento de las historias de usuario con evidencia navegable HTML."
    )

    add_styled_table(
        ["Nivel de Prueba", "Framework / Herramienta", "Casos / Specs", "Estado Final"],
        [
            ["Unitario Backend", "Vitest (Clean Architecture)", "12 suites / 96 tests", "PASS ✅"],
            ["Unitario Frontend", "Vitest + Testing Library", "9 suites / 69 tests", "PASS ✅"],
            ["Integración API", "Vitest + Supertest", "Endpoints de negocio", "PASS ✅"],
            ["Sistema E2E Funcional", "Cypress 15.21.1", "18 specs (5 suites)", "PASS ✅"],
            ["Aceptación BDD", "Serenity/JS + Screenplay", "7 escenarios Gherkin", "PASS ✅"],
            ["Exploratorio con IA", "Stagehand + Gemini Flash", "3 escenarios cognitivos", "PASS ✅"],
        ],
        [1.8, 2.2, 1.5, 1.0]
    )

    # ==============================================================
    # SECCIÓN 8: TIPOS DE PRUEBA
    # ==============================================================
    add_h1("8. TIPOS DE PRUEBA")
    add_h2("8.1 Pruebas funcionales")
    add_body(
        "Verifican el comportamiento frente a los requerimientos: registro/login de usuarios, movimientos de bolsillos, "
        "cálculo de amortización de créditos, emisión de tarjetas y transición de estados atómicos en base de datos."
    )

    add_h2("8.2 Pruebas no funcionales")
    add_bullet("Protección contra inyección en campos numéricos, rechazo 401 sin JWT, bloqueo 403 a rutas admin.", "Seguridad: ")
    add_bullet("Auditoría con axe-core integrado en Cypress (WCAG 2.1 AA) sin violaciones críticas.", "Accesibilidad (a11y): ")
    add_bullet("Medición de latencia de endpoints en pruebas de integración (POST /loans/simulate < 500 ms).", "Rendimiento básico: ")

    add_h2("8.3 Pruebas estáticas")
    add_bullet("ESLint estricto en backend y frontend como compuerta del pipeline.", "Linting: ")
    add_bullet("TypeScript strict mode para erradicar cualquier tipo any en el código de producción.", "Type-checking: ")
    add_bullet("SonarQube (npm run sonar) validando deuda técnica y calidad con perfiles predefinidos.", "Análisis de Código: ")

    add_h2("8.4 Pruebas de regresión")
    add_body(
        "Automatizadas mediante scripts/regression.ps1. Cualquier cambio en dev desencadena la ejecución "
        "de Cypress, Serenity y Vitest. Criterio de paso innegociable: cero fallos."
    )

    # ==============================================================
    # SECCIÓN 9: TÉCNICAS DE DISEÑO DE PRUEBAS
    # ==============================================================
    add_h1("9. TÉCNICAS DE DISEÑO DE PRUEBAS")
    add_styled_table(
        ["Técnica Aplicada", "Principio de Diseño", "Implementación en FuBanking"],
        [
            ["Partición de Equivalencia", "Clases válidas e inválidas", "Montos válidos vs negativos, cero o strings"],
            ["Valores Límite (BVA)", "Fronteras de rangos", "Límites mínimo ($500.000) y máximo ($50.000.000)"],
            ["Tablas de Decisión", "Combinatoria de condiciones", "Matriz: (Ingreso validado, Edad >=18, Doc OK) → Apto"],
            ["Transición de Estados", "Ciclo de vida de entidades", "Solicitud → PENDING → APPROVED/REJECTED"],
            ["BDD Given/When/Then", "Especificación ejecutable", "Escenarios Gherkin en Serenity/JS"],
            ["Exploración Guiada por IA", "Comprensión semántica", "Stagehand interactúa con UI sin selectores XPath rígidos"],
            ["Sesión de Prueba (SBTM)", "Prueba heurística basada en tiempo", "Playwright MCP Server con agente autónomo y traza JSON"],
        ],
        [1.8, 1.9, 2.8]
    )

    # ==============================================================
    # SECCIÓN 10: ENTORNO DE PRUEBAS
    # ==============================================================
    add_h1("10. ENTORNO DE PRUEBAS")
    add_styled_table(
        ["Componente de Infraestructura", "Detalle de Configuración", "Propósito en Pruebas"],
        [
            ["Servidor Backend API", "Node.js 22 + Express 5 (:3001/api/v1)", "Endpoints REST y middlewares de seguridad"],
            ["Cliente Frontend Web", "Next.js 16 + React 19 (:3000)", "Interfaz gráfica responsive y módulos de banca"],
            ["Base de Datos", "PostgreSQL gestionado en Supabase Cloud", "Persistencia transaccional de todos los módulos"],
            ["Navegadores de Ejecución", "Chromium y Electron (modo Headless y GUI)", "Ejecución de Cypress, Serenity y Playwright"],
            ["Contenedores Docker", "Docker Desktop (ReportPortal en puerto :8088)", "Observabilidad y dashboards centralizados"],
            ["Pipeline CI/CD", "Jenkins (Jenkinsfile) ejecutado en ramas dev/main", "Construcción automatizada e integración continua"],
        ],
        [1.8, 2.5, 2.2]
    )

    # ==============================================================
    # SECCIÓN 11: DATOS DE PRUEBA
    # ==============================================================
    add_h1("11. DATOS DE PRUEBA")
    add_body("Se definieron usuarios estáticos con tokens inyectados programáticamente (loginByApi):")
    add_styled_table(
        ["Rol del Usuario", "Correo Electrónico de Prueba", "Finalidad en las Suites"],
        [
            ["Cliente Estándar", "bedoyacanoandres2@gmail.com", "Operaciones de cliente: simulación, bolsillos, tarjetas"],
            ["Administrador", "bedoyacanoandres@gmail.com", "Revisión de solicitudes pendientes, aprobación y rechazo"],
        ],
        [1.8, 2.5, 2.2]
    )

    add_body("Parámetros financieros utilizados en los casos de prueba de crédito:")
    add_styled_table(
        ["Campo", "Valor de Prueba Típico", "Propósito de la Validación"],
        [
            ["amount (monto)", "$1.000.000 COP", "Caso típico de crédito personal"],
            ["term_months (plazo)", "12 meses", "Plazo estándar para amortización mensual"],
            ["annual_rate (tasa)", "12% EA", "Tasa efectiva anual para cálculo de interés"],
            ["purpose (propósito)", "Compra de equipo tecnológico", "Justificación textual de la solicitud"],
            ["amount (límite)", "$500.000 COP / $50.000.000 COP", "Verificación de bordes permitidos"],
        ],
        [1.8, 2.2, 2.5]
    )

    # ==============================================================
    # SECCIÓN 12: CRITERIOS DE ENTRADA, SALIDA Y ACEPTACIÓN
    # ==============================================================
    add_h1("12. CRITERIOS DE PRUEBA")
    add_h2("12.1 Criterios de entrada")
    add_bullet("Servidores backend (:3001) y frontend (:3000) respondiendo correctamente con código 200 OK.")
    add_bullet("Base de datos Supabase accesible con esquema de tablas migrado y sin inconsistencias.")
    add_bullet("Variables de entorno configuradas (.env / .env.test) en los puestos de prueba.")

    add_h2("12.2 Criterios de salida")
    add_bullet("100% de los casos de prueba automatizados ejecutados.")
    add_bullet("0 pruebas fallidas en las suites de regresión (Cypress, Serenity, Vitest).")
    add_bullet("0 defectos abiertos de severidad Crítica o Alta sin resolución.")
    add_bullet("Evidencias generadas: reportes Mochawesome, Serenity HTML, capturas y trazas JSON.")

    add_h2("12.3 Criterios de aceptación por módulo")
    add_bullet("Auth: Autenticación JWT y bloqueo de seguridad 429 ante intentos reiterados.", "Módulo Usuarios: ")
    add_bullet("Bolsillos: Integridad de saldos en abonos y retiros entre cuenta principal y bolsillo.", "Módulo Bolsillos: ")
    add_bullet("Créditos: Amortización exacta con LoanCalculator y creación de cuenta de crédito al aprobar.", "Módulo Créditos: ")
    add_bullet("Tarjetas: Emisión correcta y revelación segura de datos sensibles.", "Módulo Tarjetas: ")

    # ==============================================================
    # SECCIÓN 13: GESTIÓN DE DEFECTOS
    # ==============================================================
    add_h1("13. GESTIÓN DE DEFECTOS")
    add_body(
        "Flujo del ciclo de vida del defecto: "
        "Detección → Registro → Clasificación → Asignación al Dev → Corrección → Re-test → Cierre."
    )
    add_styled_table(
        ["Severidad", "Criterio de Clasificación", "Ejemplo en el Proyecto", "Tiempo Límite"],
        [
            ["Crítica", "Bloqueo total del sistema o corrupción de base de datos", "Fallo total de autenticación o caída de Supabase", "Inmediato (P1)"],
            ["Alta", "Funcionalidad principal rota sin alternativa viable", "Error al crear la solicitud de crédito o bolsillo", "< 24 horas (P2)"],
            ["Media", "Fallo funcional con alternativa o desvío menor", "Cálculo de cuota con redondeo impreciso", "< 48 horas (P3)"],
            ["Baja", "Defecto cosmético, tipográfico o visual menor", "Desalineación de botón o texto con typo", "Fin de sprint (P4)"],
        ],
        [1.3, 2.4, 1.8, 1.0]
    )

    # ==============================================================
    # SECCIÓN 14: IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS
    # ==============================================================
    add_h1("14. IDENTIFICACIÓN Y ANÁLISIS DE RIESGOS")
    add_body("Matriz de los 10 riesgos evaluados durante el proceso de aseguramiento:")
    add_styled_table(
        ["ID", "Riesgo Técnico o de Proceso", "Prob.", "Impacto", "Estrategia de Mitigación Implementada"],
        [
            ["R-01", "Inestabilidad en Supabase Cloud", "Media", "Alto", "Datos de prueba idempotentes y script seed"],
            ["R-02", "Desfase entre API y contratos", "Alta", "Alto", "Verificación estricta en Vitest y Zod schemas"],
            ["R-03", "Agotamiento de cuota API Gemini", "Media", "Medio", "Model routing configurado con fallback mock"],
            ["R-04", "Conflicto de puertos Jenkins vs RP", "Baja", "Medio", "ReportPortal fijado en puerto :8088"],
            ["R-05", "Selectores CSS frágiles en Next.js", "Media", "Medio", "Uso exclusivo de data-cy e IA de Stagehand"],
            ["R-06", "Restricción de tiempo del equipo", "Alta", "Medio", "Regresión automatizada por scripts de 1 clic"],
            ["R-07", "Divergencia entre ramas de trabajo", "Media", "Bajo", "Integración continua con rebase ordenado"],
            ["R-08", "No determinismo en pruebas IA", "Alta", "Bajo", "Prompts estructurados y reintentos automáticos"],
            ["R-09", "Indisponibilidad de Docker local", "Baja", "Bajo", "Reportes HTML locales independientes"],
            ["R-10", "Expiración de tokens JWT en tests", "Media", "Alto", "Generación de tokens con vigencia extendida"],
        ],
        [0.6, 2.1, 0.7, 0.7, 2.4]
    )

    # ==============================================================
    # SECCIÓN 15: ORGANIZACIÓN Y RESPONSABILIDADES
    # ==============================================================
    add_h1("15. ORGANIZACIÓN Y RESPONSABILIDADES")
    add_body(
        "El equipo de pruebas opera bajo un modelo horizontal y colaborativo, donde cada integrante lidera "
        "el aseguramiento de calidad de su módulo correspondiente con la misma jerarquía y corresponsabilidad:"
    )
    add_styled_table(
        ["Integrante del Equipo", "Módulo Asignado", "Rol en el Proyecto", "Responsabilidades Específicas"],
        [
            ["Andres Bedoya Cano", "Créditos y Préstamos", "Ingeniero de Calidad QA", "Simulador, aprobación admin, suites Cypress E2E, BDD y herramientas"],
            ["Dubin Andres Soto", "Autenticación & Usuarios", "Ingeniero de Calidad QA", "Pruebas de registro, login, tokens JWT, seguridad y 2FA"],
            ["Tomas Henao", "Ahorros (Bolsillos)", "Ingeniero de Calidad QA", "Pruebas de bolsillos de ahorro, abonos, retiros e integridad de saldos"],
            ["Stiven Alejandro Bustamante", "Tarjetas Virtuales", "Ingeniero de Calidad QA", "Pruebas de emisión de tarjetas, datos sensibles y bloqueo/desbloqueo"],
        ],
        [1.7, 1.6, 1.4, 1.8]
    )

    # ==============================================================
    # SECCIÓN 16: CRONOGRAMA DE PRUEBAS
    # ==============================================================
    add_h1("16. CRONOGRAMA DE ACTIVIDADES")
    add_styled_table(
        ["Semana", "Período (2026)", "Fase / Actividad Desarrollada", "Equipo Involucrado"],
        [
            ["S1-S2", "23 Jul - 05 Ago", "Configuración inicial, arquitectura limpia y setup del repositorio", "Equipo de Testing"],
            ["S3-S4", "06 Ago - 19 Ago", "Pruebas unitarias de backend e integración API con Vitest", "Equipo de Testing"],
            ["S5-S6", "20 Ago - 02 Sep", "Diseño de casos de prueba de sistema y validación de requisitos", "Equipo de Testing"],
            ["S7-S8", "03 Sep - 16 Sep", "Implementación de suites Cypress E2E para flujos de usuario", "Equipo de Testing"],
            ["S9-S10", "17 Sep - 30 Sep", "Adopción de BDD con Serenity/JS (Screenplay) y Katalon Recorder", "Equipo de Testing"],
            ["S11", "01 Oct - 07 Oct", "Pruebas con IA generativa mediante Stagehand y Gemini Flash", "Equipo de Testing"],
            ["S12-S13", "08 Oct - 21 Oct", "Implementación de Playwright MCP, Cypress Cloud y ReportPortal", "Equipo de Testing"],
            ["S14", "22 Oct - 26 Oct", "Regresión final de los 4 módulos, refactorización y entrega", "Equipo de Testing"],
        ],
        [0.9, 1.3, 3.2, 1.1]
    )

    # ==============================================================
    # SECCIÓN 17: MÉTRICAS Y SEGUIMIENTO
    # ==============================================================
    add_h1("17. MÉTRICAS Y SEGUIMIENTO")
    add_callout(
        "Indicador Global de Calidad del Sistema",
        "Total de verificaciones automatizadas activas: 49 (39 tests funcionales/seguridad/a11y + 7 BDD + 3 IA). Tasa de aprobación: 100% PASS."
    )

    add_styled_table(
        ["Suite de Evaluación", "Herramienta Empleada", "Volumen", "Tasa de Éxito", "Estado"],
        [
            ["Pruebas Unitarias Backend", "Vitest", "96 pruebas", "100%", "PASS ✅"],
            ["Pruebas Unitarias Frontend", "Vitest + React Testing Library", "69 pruebas", "100%", "PASS ✅"],
            ["Integración API", "Vitest (Supertest)", "Endpoints REST", "100%", "PASS ✅"],
            ["Cypress E2E Funcional", "Cypress 15.21.1", "18 pruebas (5 specs)", "100%", "PASS ✅"],
            ["BDD Criterios de Aceptación", "Serenity/JS + Cucumber", "7 escenarios", "100%", "PASS ✅"],
            ["Exploración Asistida por IA", "Stagehand + Gemini Flash", "3 escenarios", "100%", "PASS ✅"],
            ["Playwright MCP Automation", "@playwright/mcp + SDK", "1 sesión completa", "100%", "PASS ✅"],
            ["Cypress Cloud con IA", "Cypress Cloud (ypgf2b)", "4 pruebas sync", "100%", "PASS ✅"],
            ["ReportPortal Observabilidad", "Docker Stack (:8088)", "Doble ingesta activa", "100%", "PASS ✅"],
        ],
        [1.8, 1.8, 1.1, 0.9, 0.9]
    )

    # ==============================================================
    # SECCIÓN 18: ENTREGABLES DE PRUEBA
    # ==============================================================
    add_h1("18. ENTREGABLES DE PRUEBA")
    add_styled_table(
        ["Entregable Formal", "Ubicación en el Repositorio", "Descripción del Contenido"],
        [
            ["Plan de Pruebas v2.0 (Word & MD)", "docs/plan-de-pruebas-fubank-v2.docx / .md", "Documento rector con especificación ISO 29119"],
            ["Suite Cypress E2E", "cypress/e2e/ y cypress/reports/html/", "5 specs con reportes Mochawesome consolidados"],
            ["Suite Serenity/JS BDD", "e2e/serenity/ y target/site/serenity/", "Features Gherkin e informe navegable Screenplay"],
            ["Suite Stagehand IA", "e2e/stagehand/src/scenarios/ y evidence/", "Escenarios cognitivos con capturas PNG de auditoría"],
            ["Playwright MCP Server", "test/pruebas-herramientas/herramientas-bedoya/01-mcp/", "Runner TypeScript, trace JSON y captura"],
            ["Cypress Cloud + AI", "test/pruebas-herramientas/herramientas-bedoya/02-cypress/", "Specs con cy.prompt() vinculadas al cloud ypgf2b"],
            ["ReportPortal Stack", "test/pruebas-herramientas/herramientas-bedoya/03-report/", "docker-compose.yml y agentes Cypress/Playwright"],
            ["Documento de Sustentación", "test/pruebas-herramientas/.../SUSTENTACION.md", "Justificación técnica profunda de las 3 herramientas"],
        ],
        [2.0, 2.5, 2.0]
    )

    # ==============================================================
    # SECCIÓN 19: INFORME FINAL DE PRUEBAS
    # ==============================================================
    add_h1("19. INFORME FINAL DE PRUEBAS (CIERRE)")
    add_h2("19.1 Resumen ejecutivo")
    add_body(
        "El ciclo de pruebas de FuBank fue completado exitosamente dentro del marco del curso Validación y Verificación "
        "de Software (semestre 2026-2). La estrategia desplegada por el equipo garantizó que los cuatro módulos "
        "fueran cubiertos en las distintas dimensiones de la pirámide de calidad, complementada con herramientas de vanguardia tecnológica."
    )

    add_h2("19.2 Balance de calidad")
    add_styled_table(
        ["Métrica de Calidad Evaluada", "Meta del Plan", "Resultado Obtenido", "Evaluación"],
        [
            ["Pruebas Automatizadas Activas", "≥ 30 checks", "49 verificaciones", "Superada ✅"],
            ["Tasa de Éxito en Regresión Final", "≥ 95%", "100% (0 fallos)", "Excelente ✅"],
            ["Defectos Críticos Abiertos", "0 defectos", "0 defectos", "Cumplida ✅"],
            ["Defectos de Severidad Alta Abiertos", "0 defectos", "0 defectos", "Cumplida ✅"],
            ["Tiempo de Regresión Completa", "< 120 segundos", "~63 segundos", "Óptimo ✅"],
            ["Herramientas Avanzadas Sustentadas", "3 tecnologías", "3 implementadas y operativas", "Cumplida ✅"],
        ],
        [2.3, 1.4, 1.6, 1.2]
    )

    add_h2("19.3 Conclusiones y recomendaciones")
    add_bullet("Los módulos evaluados cuentan con cobertura robusta y reproducible que protege contra regresiones.", "Robustez Demostrada: ")
    add_bullet("La incorporación de Stagehand y Playwright MCP evidencia la viabilidad de pruebas asistidas por IA para flujos bancarios.", "Innovación Técnica: ")
    add_bullet("El trabajo en equipo permitió abordar múltiples niveles de prueba con criterios uniformes y calidad homogénea.", "Trabajo Colaborativo: ")

    # ==============================================================
    # SECCIÓN 20: GESTIÓN DEL DOCUMENTO
    # ==============================================================
    add_h1("20. GESTIÓN DEL DOCUMENTO")
    add_h2("20.1 Historial de versiones")
    add_styled_table(
        ["Versión", "Fecha", "Descripción del Cambio", "Equipo de Autores"],
        [
            ["1.0", "03/08/2026", "Estructura inicial e introducción base del plan", "Equipo de Testing FuBanking"],
            ["2.0", "26/10/2026", "Documento completo auditado con evidencia de testing y diseño corporativo", "Equipo de Testing FuBanking"],
        ],
        [1.0, 1.3, 3.0, 1.2]
    )

    add_h2("20.2 Firmas de aprobación formal del equipo")
    add_styled_table(
        ["Rol / Función", "Nombre Completo", "Firma", "Fecha"],
        [
            ["Ingeniero de Calidad (Créditos)", "Andres Bedoya Cano", "_________________________", "26/10/2026"],
            ["Ingeniero de Calidad (Auth)", "Dubin Andres Soto", "_________________________", "26/10/2026"],
            ["Ingeniero de Calidad (Bolsillos)", "Tomas Henao", "_________________________", "26/10/2026"],
            ["Ingeniero de Calidad (Tarjetas)", "Stiven Alejandro Bustamante", "_________________________", "26/10/2026"],
            ["Docente Evaluador", "Profesor Asignatura", "_________________________", "___________"],
        ],
        [1.8, 1.8, 1.8, 1.1]
    )

    doc.save(OUTPUT_DOCX)
    print(f"OK - Documento generado exitosamente en: {OUTPUT_DOCX}")

if __name__ == "__main__":
    build_document()
