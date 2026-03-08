'use client'

import React, { useState, Children, useRef, useLayoutEffect, useEffect, useImperativeHandle, forwardRef, HTMLAttributes, ReactNode } from 'react'
import { motion, AnimatePresence, Variants } from 'framer-motion'

export interface StepperRef {
  goToNext: () => void
  goToPrevious: () => void
  goToStep: (step: number) => void
  currentStep: number
}

interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  initialStep?: number
  onStepChange?: (step: number) => void
  onFinalStepCompleted?: () => void
  stepCircleContainerClassName?: string
  stepContainerClassName?: string
  contentClassName?: string
  footerClassName?: string
  backButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  nextButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>
  backButtonText?: string
  nextButtonText?: string
  finalButtonText?: string
  disableStepIndicators?: boolean
  renderStepIndicator?: (props: {
    step: number
    currentStep: number
    onStepClick: (clicked: number) => void
  }) => ReactNode
  autoAdvance?: boolean
}

const Stepper = forwardRef<StepperRef, StepperProps>(({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Previous',
  nextButtonText = 'Next',
  finalButtonText = 'Submit',
  disableStepIndicators = false,
  renderStepIndicator,
  autoAdvance = false,
  ...rest
}, ref) => {
  const [currentStep, setCurrentStep] = useState<number>(initialStep)
  const [direction, setDirection] = useState<number>(0)
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps
  const headerRef = useRef<HTMLDivElement>(null)
  const stepRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1)
      updateStep(currentStep + 1)
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setDirection(step > currentStep ? 1 : -1)
      updateStep(step)
    }
  }

  useImperativeHandle(ref, () => ({
    goToNext: handleNext,
    goToPrevious: handleBack,
    goToStep,
    currentStep
  }))

  // Auto-scroll to active step on mobile
  useEffect(() => {
    if (headerRef.current && stepRefs.current[currentStep]) {
      const stepElement = stepRefs.current[currentStep]
      const headerElement = headerRef.current
      
      if (stepElement && headerElement) {
        // Only auto-scroll on mobile devices (width <= 768px)
        if (window.innerWidth <= 768) {
          const headerRect = headerElement.getBoundingClientRect()
          const stepRect = stepElement.getBoundingClientRect()
          const scrollLeft = headerElement.scrollLeft
          const stepLeft = stepRect.left - headerRect.left + scrollLeft
          const stepWidth = stepRect.width
          const headerWidth = headerRect.width
          
          // Calculate the position to center the step (or at least make it visible)
          const targetScroll = stepLeft - (headerWidth / 2) + (stepWidth / 2)
          
          headerElement.scrollTo({
            left: targetScroll,
            behavior: 'smooth'
          })
        }
      }
    }
  }, [currentStep])

  const handleComplete = () => {
    setDirection(1)
    updateStep(totalSteps + 1)
  }

  return (
    <div
      className="stepper-wrapper"
      {...rest}
    >
      <div
        className={`stepper-container ${stepCircleContainerClassName}`}
      >
        <div 
          ref={headerRef}
          className={`stepper-header ${stepContainerClassName}`}
        >
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1
            const isNotLastStep = index < totalSteps - 1
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: clicked => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    }
                  })
                ) : (
                  <StepIndicator
                    ref={(el) => {
                      if (el) {
                        stepRefs.current[stepNumber] = el
                      }
                    }}
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={clicked => {
                      setDirection(clicked > currentStep ? 1 : -1)
                      updateStep(clicked)
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            )
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          className={`stepper-content-wrapper ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`stepper-navigation ${footerClassName}`}>
            {currentStep !== 1 && (
              <button
                onClick={handleBack}
                className="stepper-button stepper-button-back"
                {...backButtonProps}
              >
                {backButtonText}
              </button>
            )}
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              className="stepper-button stepper-button-next"
              {...nextButtonProps}
            >
              {isLastStep ? (finalButtonText || 'Submit') : nextButtonText}
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

Stepper.displayName = 'Stepper'

export default Stepper

interface StepContentWrapperProps {
  isCompleted: boolean
  currentStep: number
  direction: number
  children: ReactNode
  className?: string
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  children,
  className = ''
}: StepContentWrapperProps) {
  const [parentHeight, setParentHeight] = useState<number>(0)

  return (
    <motion.div
      style={{ position: 'relative', overflow: 'visible' }}
      animate={{ height: isCompleted ? 0 : parentHeight }}
      transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
      className={className}
    >
      <AnimatePresence initial={false} mode="sync" custom={direction}>
        {!isCompleted && (
          <SlideTransition key={currentStep} direction={direction} onHeightReady={h => setParentHeight(h)}>
            {children}
          </SlideTransition>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface SlideTransitionProps {
  children: ReactNode
  direction: number
  onHeightReady: (height: number) => void
}

function SlideTransition({ children, direction, onHeightReady }: SlideTransitionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (containerRef.current) {
      onHeightReady(containerRef.current.offsetHeight)
    }
  }, [children, onHeightReady])

  return (
    <motion.div
      ref={containerRef}
      custom={direction}
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.4, ease: 'easeInOut' }}
      style={{ position: 'absolute', left: 0, right: 0, top: 0 }}
    >
      {children}
    </motion.div>
  )
}

const stepVariants: Variants = {
  enter: (dir: number) => ({
    x: dir >= 0 ? '100%' : '-100%',
    opacity: 0
  }),
  center: {
    x: '0%',
    opacity: 1
  },
  exit: (dir: number) => ({
    x: dir >= 0 ? '-50%' : '50%',
    opacity: 0
  })
}

interface StepProps {
  children: ReactNode
}

export function Step({ children }: StepProps) {
  return <div className="stepper-step-content">{children}</div>
}

interface StepIndicatorProps {
  step: number
  currentStep: number
  onClickStep: (clicked: number) => void
  disableStepIndicators?: boolean
}

const StepIndicator = forwardRef<HTMLDivElement, StepIndicatorProps>(({ 
  step, 
  currentStep, 
  onClickStep, 
  disableStepIndicators = false 
}, ref) => {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete'

  const handleClick = () => {
    if (step !== currentStep && !disableStepIndicators) {
      onClickStep(step)
    }
  }

  return (
    <motion.div
      ref={ref}
      onClick={handleClick}
      className="stepper-step-indicator"
      animate={status}
      initial={false}
    >
      <motion.div
        className="stepper-circle"
        variants={{
          inactive: { scale: 1, backgroundColor: '#e5e7eb', color: '#9ca3af' },
          active: { scale: 1.1, backgroundColor: '#dc2626', color: '#ffffff' },
          complete: { scale: 1, backgroundColor: '#10b981', color: '#ffffff' }
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {status === 'complete' ? (
          <CheckIcon className="stepper-check-icon" />
        ) : (
          <span>{step}</span>
        )}
      </motion.div>
    </motion.div>
  )
})

StepIndicator.displayName = 'StepIndicator'

interface StepConnectorProps {
  isComplete: boolean
}

function StepConnector({ isComplete }: StepConnectorProps) {
  const lineVariants: Variants = {
    incomplete: { scaleX: 0, backgroundColor: '#e5e7eb' },
    complete: { scaleX: 1, backgroundColor: '#10b981' }
  }

  return (
    <div className="stepper-line-container">
      <motion.div
        className="stepper-line"
        variants={lineVariants}
        initial={false}
        animate={isComplete ? 'complete' : 'incomplete'}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        style={{ originX: 0 }}
      />
    </div>
  )
}

interface CheckIconProps extends React.SVGProps<SVGSVGElement> {}

function CheckIcon(props: CheckIconProps) {
  return (
    <svg {...props} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <motion.path
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{
          delay: 0.1,
          type: 'tween',
          ease: 'easeOut',
          duration: 0.3
        }}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
