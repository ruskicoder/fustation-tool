
------------------------------
## Standardized UI Conventions & Design System Specification
This specification defines the mandatory frontend architecture, component behaviors, and styling conventions for the FAMS / FTMADS (Curriculum Service) web application. All implementations must comply strictly with these constraints to ensure visual consistency, performance, and cross-device safety.

## 2. Layout Architecture & Viewport Constraints
The application layout enforces a non-shifting, single-page viewport encapsulation. Global layouts must prevent root-level window scrolling.

+--------------------------------------------------------------+
|                           HEADER                             |
+-----------+--------------------------------------------------+
|                                        |                     |
|                                        |                     |
|                                        |                     |
|                  CONTENT               |    ACTION PANEL     |
|                                        |                     |
|                                        |                     |
|                                        |                     |
+-----------+--------------------------------------------------+

## 2.1 Spatial Grid Segmentation

* Root Configuration: Enforce a absolute viewport lock using h-screen w-screen overflow-hidden flex.
* Sidebar Node: Pinned to the left axis using h-full flex-shrink-0 or a fixed-width static layout.
* Header Node: Pinned to the top viewport edge. Must contain breadcrumbs, page intent titles, and primary contextual global options.
* Main Workspace Container: Configured with flex-1 min-w-0 flex flex-col overflow-hidden. The inner viewport must handle content containment using overflow-y-auto or overflow-x-auto.
* Footer / Action Bar: Pinned to the bottom viewport boundary using absolute or fixed layout wrappers.

## 2.2 Layout Stability & Scroll Heuristics

* Layout Shift Prevention: Structural boundaries (Headers, Sidebars, Pagination, Dialog Footers) must remain layout-stable. Dynamic content insertion must not trigger structural page jumps.
* Scroll Boundary Isolation: Only the inner body containers or inner data table bodies are permitted to scroll.

------------------------------
## 3. Typography, Imagery, & Tokenized Color Palette## 3.1 Design System Color Mappings
Implementations must use the exact Tailwind token variants listed below:

| UI System State | Tailwind Utility Classes | Hex / Contextual Application |
|---|---|---|
| Primary Interaction / CTA | bg-blue-600 hover:bg-blue-700 text-white | #2563EB / Active Save Buttons, Primary Tabs |
| Success Badge Layer | bg-green-100 text-green-800 or bg-indigo-50 text-indigo-700 border border-indigo-200 | State tracking for ACTIVE, IN_PROGRESS, TRAINING_COMPLETED |
| Warning Badge Layer | bg-yellow-100 text-yellow-800 or bg-slate-100 text-slate-700 border border-slate-200 | State tracking for DRAFT, REVIEWING |
| Danger / Destructive | bg-red-600 hover:bg-red-700 text-white or bg-rose-50 text-rose-700 border border-rose-200 | Deletions, Error states, INACTIVE, CANCELLED, DECLINED |
| App Surfaces (Backdrop) | bg-slate-50 or bg-gray-100 | Structural layout background fills |
| Component Surfaces | bg-white | Cards, Modal panels, Data table canvas grids |

## 3.2 Typography & Overflow Strategies

* Data Weights: Entity strings and table cell values must use regular weights (font-normal text-gray-900 or text-slate-700). Do not apply bold styling to body text.
* System Identifiers: Technical codes (e.g., TP_01), semantic versions (v1.0), timestamps, and structural array indices must use a monospace font (font-mono text-xs).
* Text Truncation Rules: Continuous multi-word content strings (e.g., Program Names, Descriptions, Guidelines) must be restricted to a single row using the truncate utility class. All truncated nodes must include an HTML title property or a Radix Tooltip component to allow access to the complete string on hover.

------------------------------
## 4. Navigation & Contextual Headers

* Breadcrumb Hierarchies: Every application view must render a breadcrumb navigation trail above the primary page header title. Text weights must be set to font-normal text-muted-foreground.
* Sticky Navigation Header: Page context titles (text-2xl font-bold text-gray-900) and main action buttons must use sticky positioning (sticky top-0 bg-white/90 backdrop-blur z-10).
* Single CTA Pattern: Interfaces must highlight a single primary Call-to-Action button (e.g., + Create Program) per view.
* Action Alignment Matrix: Global controls (+ Add New, Export, Import) and historical navigation buttons (Back to List) must be aligned to the top-right quadrant of headers or action layouts.
* Padding Minimization: Structural white space gaps between the header and the main container must be compressed using compact utilities (pt-1 px-1 pb-3).

------------------------------
## 5. Viewport-Constrained High-Density Data Tables
Data presentation components powered by TanStack Table must comply with strict spatial limits to prevent window overflow.
## 5.1 Layout & Dimensional Constraints

* Height Ceiling Enforcement: The outermost wrapper must define strict maximum limits (e.g., max-h-[550px] or h-[calc(100vh-240px)]).
* Sticky Column Headers: The table header wrapper (thead) must remain static during vertical scrolling (bg-slate-50 sticky top-0 z-10 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider).
* Interaction Cursors: Table headers must apply text selection locks and indicate clickability using select-none cursor-pointer. Text selection beams (cursor-text) are prohibited. Headers must provide contextual definitions via title or tooltip fields on hover.
* Bi-Axial Fluidity: The grid body (tbody) must scroll independently along both axes using overflow-x-auto overflow-y-auto.

## 5.2 Row Layouts & Specialized Columns

* Row Visual States: Table rows require explicit backgrounds (bg-white), thin grid lines (border-slate-100 or border-slate-200), and smooth transitions on hover (hover:bg-slate-50/40). Alternating zebra rows are disabled across all tables.
* Index Column Definition (NO.): Tables must render an auto-incrementing index column as the leftmost data node.
* Header Label: NO. (with descriptive metadata: title="Index").
   * Evaluation Formula: row.index + 1 + pageIndex * pageSize.
   * Capabilities: Sorting must be explicitly active (enableSorting: true).
* Null Value Representation: If an active record has no database value, render an empty string (""). Placeholder characters or text (such as N/A or -) are prohibited.
* Pinned Pagination Controls: Pagination bars must be detached from the scrollable matrix and pinned into a fixed bottom utility panel (border-t bg-slate-50/50 px-6 py-4).

------------------------------
## 6. Form Architecture & Input Validation Layouts

* Pinned Bottom Actions: To eliminate scroll-to-submit workflows, form execution layouts must lock action structures into a bottom bar using fixed viewport positioning:

fixed bottom-0 left-0 right-0 h-16 border-t bg-white px-6 flex items-center justify-between z-30 shadow-lg

* Independent Form Body Scrolling: Inputs and fieldsets must scroll independently within their designated layout bounds, passing behind the fixed action bar.
* Multi-Line Text Area Handling: Long-form text input fields (e.g., description, guidelines) must use a <textarea> or Shadcn Textarea element. Standard single-line input boxes are prohibited for these fields.
* Real-Time Input Validation: Validation checks must run inline as users type. Invalid inputs must instantly trigger an explicit outline state change on the field and render a dedicated text warning immediately below the element.

------------------------------
## 7. Overlays, Dialogs, & Toast Notifications## 7.1 Modal Overlays (Radix Dialog)

* Dimensional Constraints: Modals must be restricted to standard viewport heights (max-h-[90vh] flex flex-col p-0).
* Pinned Layout Footers: Confirmation systems must be locked to the absolute bottom edge of the modal frame (sticky bottom-0 bg-slate-50 p-6 border-t z-10 flex justify-end gap-2).
* Internal Scrolling: The central content container of a modal must handle vertical scrolling independently (flex-1 overflow-y-auto p-6).

## 7.2 Toast Communication System (Sonner)

* Global Positioning: Toast notification components must be configured to render exclusively in the top-right corner of the active viewport (position="top-right").

------------------------------
## 8. Inline Actions & State Transitions## 8.1 Inline Grid Controls

* Action Column Handling: Row execution actions (such as View, Edit, Delete, or Fork) must be displayed directly inside the row space as persistent actions. They should not be hidden behind click-to-open context menus unless horizontal space is strictly limited.
* Icon Control Sizing: Control utilities require compact tap targets with soft gray hover backgrounds:

p-1.5 hover:bg-slate-100 text-slate-500 rounded cursor-pointer transition-colors


## 8.2 Interactive Status Selectors

* Inline Table Select Dropdowns: If a table allows users to update statuses inline, the cell must render an interactive <Select> wrapper styled to match system status badges:

w-[90px] text-[10px] font-extrabold uppercase h-[25px] px-1.5 py-0 rounded-md border

* State Machine Governance: Selection options must enforce valid transition flows defined by business logic rules. Back-transitions to initialization states are blocked (e.g., DRAFT $\rightarrow$ ACTIVE $\rightarrow$ INACTIVE is valid; returning an ACTIVE or INACTIVE record back to DRAFT is prohibited).

------------------------------
## 9. fustation-tool Extension Overlay UI Specifications

### 9.1 ExtractTab Left Panel 5-Row Layout Grid
The `ExtractTab` left metadata panel enforces an exact 5-row structured grid layout:
- **Row 1 (30% / 40% / 30% grid)**: `[SubjectCode]` | `[Term][ExamType]` | `[Campus]`
- **Row 2 (70% / 30% grid)**: `[SessionDate]` | `[Question Counter] Questions`
- **Row 3 (Full Width)**: `[SubjectName]`
- **Row 4 (Full Width)**: `[ExamCode]`
- **Divider**: Horizontal hairline separator.
- **Row 5 (Full Width)**: `[ View Questions ]` (Placeholder Action Button).

### 9.2 SavedTab Row Action Button Order
Each saved record row in `SavedTab` renders action buttons in strict left-to-right order:
- **Action 1**: `[ Delete ]` (Red danger button `.fus-btn-danger-icon`).
- **Action 2**: `[ Download ]` (Control button for active format export).

### 9.3 Header Control Minimal Pattern
The top-right header container of the extension overlay renders a single `–` (Minimize) control button. Redundant `×` (Close) buttons are prohibited.

