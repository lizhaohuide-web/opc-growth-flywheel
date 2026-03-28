'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { questionTemplates, QuestionTemplate, QuestionField } from '@/lib/templates/question-templates'

export default function GuidedNoteForm() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [showMethodology, setShowMethodology] = useState<boolean>(true);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showTip, setShowTip] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const supabase = createClient();
  const router = useRouter();

  const selectedTemplateData = questionTemplates.find(t => t.id === selectedTemplate) as QuestionTemplate;

  // 初始化答案对象
  useEffect(() => {
    if (selectedTemplateData) {
      const initialAnswers: Record<string, any> = {};
      selectedTemplateData.fields.forEach(field => {
        if (field.type === 'checklist') {
          initialAnswers[field.id] = [];
        } else {
          initialAnswers[field.id] = '';
        }
      });
      setAnswers(initialAnswers);
      setCurrentStep(0);
      setValidationErrors({});
    } else {
      setAnswers({});
      setCurrentStep(0);
      setValidationErrors({});
    }
  }, [selectedTemplate]);

  // 验证当前字段
  const validateField = (field: QuestionField, value: any): string => {
    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      return '此为必填项';
    }
    
    if (field.minLength && typeof value === 'string' && value.trim().length < field.minLength) {
      return `至少需要${field.minLength}个字符`;
    }
    
    return '';
  };

  // 更新答案
  const updateAnswer = (fieldId: string, value: any) => {
    const updatedAnswers = { ...answers, [fieldId]: value };
    setAnswers(updatedAnswers);

    // 实时验证
    if (selectedTemplateData) {
      const field = selectedTemplateData.fields.find(f => f.id === fieldId);
      if (field) {
        const error = validateField(field, value);
        setValidationErrors(prev => ({
          ...prev,
          [fieldId]: error
        }));
      }
    }
  };

  // 下一步
  const nextStep = () => {
    if (selectedTemplateData) {
      const currentField = selectedTemplateData.fields[currentStep];
      const error = validateField(currentField, answers[currentField.id]);
      
      if (error) {
        setValidationErrors(prev => ({
          ...prev,
          [currentField.id]: error
        }));
        return;
      }

      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentField.id];
        return newErrors;
      });

      if (currentStep < selectedTemplateData.fields.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // 上一步
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 保存笔记
  const handleSave = async () => {
    // 验证所有必填字段
    let hasErrors = false;
    const newValidationErrors: Record<string, string> = {};

    if (selectedTemplateData) {
      for (const field of selectedTemplateData.fields) {
        const error = validateField(field, answers[field.id]);
        if (error) {
          newValidationErrors[field.id] = error;
          hasErrors = true;
        }
      }
    }

    if (hasErrors) {
      setValidationErrors(newValidationErrors);
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('请先登录');
      setLoading(false);
      return;
    }

    // 生成内容格式
    let content = `## ${selectedTemplateData?.name}\n`;
    content += `> ${selectedTemplateData?.methodology}\n\n`;

    for (const field of selectedTemplateData!.fields) {
      const answer = answers[field.id];
      let displayValue = '';

      if (field.type === 'checklist' && Array.isArray(answer)) {
        displayValue = answer.join(', ');
      } else if (typeof answer === 'string') {
        displayValue = answer;
      } else {
        displayValue = String(answer || '');
      }

      content += `### ${field.label}\n${displayValue}\n\n`;
    }

    const { error } = await supabase.from('notes').insert({
      user_id: user.id,
      title: `${selectedTemplateData?.name} - ${new Date().toLocaleDateString('zh-CN')}`,
      content: content,
      tags: [...selectedTemplateData?.autoTags || [], selectedTemplateData?.category]
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard/notes');
    }
    setLoading(false);
  };

  // 渲染字段输入组件
  const renderFieldInput = (field: QuestionField) => {
    const value = answers[field.id] || '';
    const error = validationErrors[field.id];

    switch (field.type) {
      case 'textarea':
        return (
          <div className="mt-1">
            <textarea
              value={value}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              rows={4}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderColor: error ? 'var(--error)' : 'var(--border-subtle)' }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]`}
              placeholder={field.placeholder}
            />
            {field.minLength && (
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                已输入 {value.length} 字符，最少 {field.minLength} 字符
              </div>
            )}
          </div>
        );
        
      case 'text':
        return (
          <div className="mt-1">
            <input
              type="text"
              value={value}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                error ? 'border-red-500' : 'border-[var(--border-subtle)]'
              }`}
              placeholder={field.placeholder}
            />
          </div>
        );
        
      case 'select':
        return (
          <div className="mt-1">
            <select
              value={value}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                error ? 'border-red-500' : 'border-[var(--border-subtle)]'
              }`}
            >
              <option value="">请选择...</option>
              {field.options?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        );
        
      case 'rating':
        // 处理评级字段，默认为1-5星级
        // 如果有特殊需求（如1-10评级），可在模板中通过tip或其他方式说明
        return (
          <div className="mt-1 flex items-center space-x-1">
            {[1, 2, 3, 4, 5].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => updateAnswer(field.id, num)}
                className={`text-2xl ${value >= num ? 'text-[var(--warning)]' : 'text-[var(--text-tertiary)]'} hover:text-[var(--warning)] focus:outline-none`}
              >
                {value >= num ? '★' : '☆'}
              </button>
            ))}
          </div>
        );
        
      case 'checklist':
        const selectedOptions = Array.isArray(value) ? value : [];
        return (
          <div className="mt-1 space-y-2">
            {field.options?.map(option => (
              <div key={option} className="flex items-center">
                <input
                  type="checkbox"
                  id={`${field.id}-${option}`}
                  checked={selectedOptions.includes(option)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...selectedOptions, option]
                      : selectedOptions.filter((item: string) => item !== option);
                    updateAnswer(field.id, newValue);
                  }}
                  className="h-4 w-4 text-[var(--accent)] rounded focus:ring-[var(--accent)]"
                />
                <label htmlFor={`${field.id}-${option}`} className="ml-2 text-[var(--text-primary)]">
                  {option}
                </label>
              </div>
            ))}
          </div>
        );
        
      default:
        return (
          <div className="mt-1">
            <input
              type="text"
              value={value}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)] ${
                error ? 'border-red-500' : 'border-[var(--border-subtle)]'
              }`}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  // 按类别分组模板
  const categories = [
    { id: 'all', name: '🔥 全部' },
    { id: 'work', name: '📊 工作' },
    { id: 'learning', name: '📚 学习' },
    { id: 'growth', name: '🌱 成长' },
    { id: 'life', name: '❤️ 生活' },
    { id: 'health', name: '💪 健康' },
    { id: 'creation', name: '✍️ 创作' },
  ];

  const filteredTemplates = activeCategory === 'all' 
    ? questionTemplates 
    : questionTemplates.filter(t => t.category === activeCategory);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {!selectedTemplate ? (
        // 模板选择界面
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">选择笔记模板</h2>
          
          {/* 模板分类Tab */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 mb-6">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-[var(--accent)] text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)]' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          
          {/* 模板卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className="border border-[var(--border-subtle)] rounded-lg p-4 hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:border-[var(--border-accent)] cursor-pointer transition-all duration-200 transform hover:-translate-y-1"
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{template.name}</h3>
                    <p className="text-[var(--text-secondary)] text-sm mt-1">{template.description}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs bg-[var(--bg-elevated)] text-[var(--text-secondary)] px-2 py-1 rounded">
                        {template.estimatedTime}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">{template.fields.length} 个问题</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 表单填写界面
        <div className="bg-[var(--bg-card)] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* 顶部进度条 */}
          <div className="bg-[var(--bg-primary)] px-6 py-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center">
                <span className="mr-2">{selectedTemplateData?.icon}</span>
                <span style={{ color: 'var(--text-primary)' }}>{selectedTemplateData?.name}</span>
              </h2>
              <div className="text-sm text-[var(--text-secondary)]">
                {currentStep + 1} / {selectedTemplateData?.fields.length}
              </div>
            </div>
            
            {/* 进度条 */}
            <div className="mt-3 w-full bg-[var(--bg-elevated)] rounded-full h-2">
              <div 
                className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentStep + 1) / selectedTemplateData!.fields.length) * 100}%` }}
              ></div>
            </div>
            
            {/* 方法论介绍 */}
            <div className="mt-3">
              <button 
                onClick={() => setShowMethodology(!showMethodology)}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent)] flex items-center"
              >
                {showMethodology ? '▲ 收起方法论' : '▼ 展开方法论'}
              </button>
              {showMethodology && (
                <div className="mt-2 p-3 bg-[var(--accent-subtle)] rounded-md text-sm text-[var(--accent)]">
                  <strong>{selectedTemplateData?.methodology}</strong>
                </div>
              )}
            </div>
          </div>
          
          {/* 问题表单 */}
          <div className="p-6">
            {selectedTemplateData && (
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <label className="block text-lg font-medium text-[var(--text-primary)] mb-2">
                    {selectedTemplateData.fields[currentStep].label}
                    {selectedTemplateData.fields[currentStep].required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  
                  {selectedTemplateData.fields[currentStep].tip && (
                    <button
                      onMouseEnter={() => setShowTip(selectedTemplateData.fields[currentStep].id)}
                      onMouseLeave={() => setShowTip(null)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    >
                      ℹ️
                    </button>
                  )}
                </div>
                
                {selectedTemplateData.fields[currentStep].tip && showTip === selectedTemplateData.fields[currentStep].id && (
                  <div className="mb-2 p-2 bg-[var(--bg-elevated)] rounded text-sm text-[var(--text-primary)]">
                    {selectedTemplateData.fields[currentStep].tip}
                  </div>
                )}
                
                {renderFieldInput(selectedTemplateData.fields[currentStep])}
                
                {validationErrors[selectedTemplateData.fields[currentStep].id] && (
                  <div className="mt-1 text-sm text-[var(--error)]">
                    {validationErrors[selectedTemplateData.fields[currentStep].id]}
                  </div>
                )}
              </div>
            )}
            
            {/* 导航按钮 */}
            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={`px-4 py-2 rounded-md ${
                  currentStep === 0 
                    ? 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] cursor-not-allowed' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                上一步
              </button>
              
              {currentStep < (selectedTemplateData?.fields.length ?? 0) - 1 ? (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-[var(--accent)] text-white rounded-md hover:bg-[var(--accent-light)]"
                >
                  下一步
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? '保存中...' : '保存笔记'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
