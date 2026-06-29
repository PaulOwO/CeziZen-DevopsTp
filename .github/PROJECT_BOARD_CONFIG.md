## GitHub Project Configuration

This GitHub Project board manages the CESIZen maintenance workflow.

**Board Name**: CESIZen Maintenance Board
**Type**: Table view for better visibility

### Views

#### 1. All Issues
Shows all issues across all columns for comprehensive overview

#### 2. Backlog
- Filter: Label = backlog
- Sort: Recently updated
- Visibility: Shows future work

#### 3. Current Sprint (2-week iterations)
- Filter: Milestone = Current Sprint
- Shows: Todo, In Progress, In Review, Done
- Automated transitions on PR events

#### 4. Critical/Urgent
- Filter: Label = critical
- Priority view for high-severity items
- Auto-escalation on creation

### Automated Workflows

#### Auto-add to Project
New issues automatically added to project with label-based categorization

#### Sprint Planning
- Milestones represent 2-week sprints
- Named: Sprint-2026-W##
- Dates: Monday to Sunday

#### Velocity Tracking
- Tracked via GitHub Projects metrics
- Target: 13-21 points per sprint
- Reviewed at sprint retrospective

### Column Definitions

| Column | Status | Automation |
|--------|--------|-----------|
| Backlog | Not yet prioritized | Auto-add on creation |
| Ready | Prioritized, awaiting assignment | Moved by PM |
| In Progress | Being worked on | Auto-move on branch creation |
| In Review | PR/Tests pending | Auto-move on PR open |
| Done | Completed & merged | Auto-move on PR merge |

### Labels & Colors

```
🔴 PRIORITY
  - critical : Red - Drop everything
  - high : Orange - This sprint
  - medium : Yellow - Next sprint
  - low : Green - Backlog

🟢 TYPE
  - bug : Red - Defect
  - feature : Blue - New functionality
  - enhancement : Cyan - Improvement
  - technical-debt : Gray - Maintenance

🟡 STATUS
  - blocked : Black - Waiting on something
  - duplicate : Magenta - Already exists
  - help-wanted : Green - Needs input
  - security : Red - Urgent

🟠 AREA
  - breathing : Purple - Breathing module
  - emotion-tracker : Cyan - Emotion tracking
  - diagnostics : Yellow - Diagnostics module
  - accounts : Blue - User accounts
  - infra : Gray - Infrastructure
```

### Metrics & Reports

**Weekly** :
- Issues created vs closed
- Average resolution time
- Critical items aging

**Monthly** :
- Feature velocity
- Bug fix rate
- Technical debt trend

**Quarterly** :
- Team capacity analysis
- Trend analysis
- Backlog health

### Integration with Releases

Each major release:
1. Create Milestone "Release v1.2.0"
2. Assign all planned issues
3. Track progress in Project
4. Auto-close milestone on release
5. Generate release notes from closed issues
