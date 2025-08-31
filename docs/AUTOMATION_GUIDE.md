# 🤖 Cursor AI Agent Automation Guide

## 📋 **Documentation Workflow for AI Agents**

### **🔄 Development Process**

#### **1. Starting New Work**
```bash
# Create temp documentation for current work
docs/dev-reports/temp/FEATURE_NAME_DEV.md
```

#### **2. During Development**
- **Update temp docs** with progress
- **Track changes** and decisions
- **Document issues** and solutions

#### **3. Completion**
- **Move to archive** when feature is complete
- **Clean up temp** files
- **Update main docs** if needed

---

## 📁 **File Structure & Naming**

### **Current Work (temp/)**
```
docs/dev-reports/temp/
├── CURRENT_DEV_STATUS.md      # Always keep updated
├── FEATURE_NAME_DEV.md        # Feature-specific work
└── ISSUE_DEBUG.md             # Problem-solving docs
```

### **Completed Work (archive/)**
```
docs/dev-reports/archive/
├── MOBILE_OPTIMIZATION_COMPLETE.md
├── GENRE_ACCURACY_IMPROVEMENTS.md
├── ERROR_RESOLUTION_SUMMARY.md
└── ... (other completed features)
```

### **Main Documentation**
```
docs/
├── README.md                  # Project overview
├── CHANGELOG.md              # Version history
├── SEO.md                    # SEO strategy
├── SETUP.md                  # Development setup
└── AUTOMATION_GUIDE.md       # This file
```

---

## 🎯 **Automation Rules**

### **✅ Always Do**
1. **Create temp docs** for new work
2. **Update CURRENT_DEV_STATUS.md** with progress
3. **Use consistent naming** (FEATURE_NAME_DEV.md)
4. **Move to archive** when complete
5. **Clean up temp** files after success

### **❌ Never Do**
1. **Create docs in root** directory
2. **Use inconsistent naming** conventions
3. **Leave temp files** after completion
4. **Forget to update** current status

---

## 📝 **Template for New Work**

```markdown
# 🔄 [FEATURE_NAME] Development

## 📅 **Started**: [DATE]
**Agent**: Cursor AI Assistant  
**Status**: 🟡 In Progress

## 🎯 **Goal**
[Describe what we're building]

## ✅ **Completed**
- [ ] Task 1
- [ ] Task 2

## 🚧 **In Progress**
- [ ] Current task

## 📋 **Next Steps**
- [ ] Next task 1
- [ ] Next task 2

## 📊 **Progress**
**Status**: 🟡 [In Progress/Complete/Blocked]  
**Completion**: [X]%
```

---

## 🔄 **Workflow Examples**

### **Example 1: Bug Fix**
1. **Create**: `docs/dev-reports/temp/BUG_FIX_DEV.md`
2. **Work**: Fix the bug, update doc
3. **Complete**: Move to `docs/dev-reports/archive/`
4. **Clean**: Remove temp file

### **Example 2: New Feature**
1. **Create**: `docs/dev-reports/temp/NEW_FEATURE_DEV.md`
2. **Develop**: Build feature, update doc
3. **Test**: Validate functionality
4. **Complete**: Move to archive
5. **Clean**: Remove temp file

---

## 📊 **Status Tracking**

### **Status Emojis**
- 🟡 **In Progress** - Work is ongoing
- ✅ **Complete** - Feature is done
- ❌ **Blocked** - Issue preventing progress
- 🔄 **Review** - Needs review/testing

### **Priority Levels**
- 🚨 **High** - Critical, must fix
- 🟡 **Medium** - Important, should do
- 🟢 **Low** - Nice to have

---

## 🚀 **Quick Commands**

### **Create New Work Doc**
```bash
# Create temp doc for new feature
touch docs/dev-reports/temp/FEATURE_NAME_DEV.md
```

### **Move to Archive**
```bash
# Move completed work to archive
mv docs/dev-reports/temp/FEATURE_NAME_DEV.md docs/dev-reports/archive/
```

### **Clean Up**
```bash
# Remove temp files after completion
rm docs/dev-reports/temp/FEATURE_NAME_DEV.md
```

---

## 📞 **Agent Notes**

- **Always update** CURRENT_DEV_STATUS.md
- **Use temp folder** for work in progress
- **Move to archive** when complete
- **Keep main docs** clean and current
- **Follow naming** conventions strictly

---

**Last Updated**: January 31, 2025  
**Agent**: Cursor AI Assistant  
**Status**: ✅ Automation Guide Complete
